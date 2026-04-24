import { MONTHS, SHIFT_BY_CODE } from "./constants";
import { dayKeyForDate } from "./date";
import { formatPresenceCategoryLabel } from "./format";

function isPeonWorker(worker) {
  const puesto = (worker?.puesto || "").toUpperCase();
  return puesto.includes("PEON") || puesto.includes("PEON");
}

function categoryShiftCode(category) {
  if (category.endsWith("T.M")) {
    return "M";
  }
  if (category.endsWith("T.T")) {
    return "T";
  }
  if (category.endsWith("T.N")) {
    return "N";
  }
  return "";
}

export function getScheduleValue(hospitalData, workerName, monthIndex, dayIndex, edits) {
  const editKey = `${workerName}|${monthIndex}|${dayIndex}`;
  if (edits?.[editKey] !== undefined) {
    return edits[editKey];
  }

  const workerSchedule = hospitalData.monthlySchedule?.[workerName];
  const monthSchedule = workerSchedule?.[monthIndex + 1];
  return (monthSchedule?.[dayIndex] ?? "").toString().trim();
}

export function requiredFor(presences, hospitalKey, dayKey, category) {
  return Math.round(presences?.[hospitalKey]?.[dayKey]?.[category] || 0);
}

export function countAssigned(hospitalData, edits, year, monthIndex, day, category) {
  const shiftCode = categoryShiftCode(category);
  if (!shiftCode) {
    return 0;
  }

  const targetIsPeon = category.startsWith("PEON");
  let total = 0;

  for (const worker of hospitalData.workers) {
    if (targetIsPeon !== isPeonWorker(worker)) {
      continue;
    }

    const scheduleValue = getScheduleValue(
      hospitalData,
      worker.name,
      monthIndex,
      day - 1,
      edits,
    );

    if ((scheduleValue || "").toUpperCase() === shiftCode) {
      total += 1;
    }
  }

  return total;
}

export function buildCoverageToastRows({
  hospitalData,
  presences,
  hospitalKey,
  edits,
  nextEdits,
  worker,
  beforeValue,
  nextValue,
  year,
  monthIndex,
  day,
}) {
  const isPeon = isPeonWorker(worker);
  const prefix = isPeon ? "PEON" : "LIMPIADOR";
  const turnToCategory = {
    M: `${prefix} T.M`,
    T: `${prefix} T.T`,
    N: `${prefix} T.N`,
  };

  const affected = new Set();
  const beforeCategory = turnToCategory[(beforeValue || "").toUpperCase()];
  const nextCategory = turnToCategory[(nextValue || "").toUpperCase()];

  if (beforeCategory) {
    affected.add(beforeCategory);
  }
  if (nextCategory) {
    affected.add(nextCategory);
  }

  const dayKey = dayKeyForDate(year, monthIndex, day);
  const rows = [];

  for (const category of affected) {
    const required = requiredFor(presences, hospitalKey, dayKey, category);
    const beforeAssigned = countAssigned(
      hospitalData,
      edits,
      year,
      monthIndex,
      day,
      category,
    );
    const afterAssigned = countAssigned(
      hospitalData,
      nextEdits,
      year,
      monthIndex,
      day,
      category,
    );

    if (beforeAssigned === afterAssigned) {
      continue;
    }

    rows.push({
      category,
      label: formatPresenceCategoryLabel(category),
      dayLabel: `${day} ${MONTHS[monthIndex].toLowerCase()} · ${dayKey.toLowerCase()}`,
      beforeAssigned,
      afterAssigned,
      required,
    });
  }

  return rows;
}

export function buildMonthlyCoverageSummary(
  hospitalData,
  presences,
  hospitalKey,
  edits,
  year,
  monthIndex,
  categories,
) {
  const daysInCurrentMonth = new Date(year, monthIndex + 1, 0).getDate();
  return categories
    .map((category) => {
      let required = 0;
      let assigned = 0;
      let deficitDays = 0;

      for (let day = 1; day <= daysInCurrentMonth; day += 1) {
        const dayKey = dayKeyForDate(year, monthIndex, day);
        const requiredByDay = requiredFor(presences, hospitalKey, dayKey, category);
        const assignedByDay = countAssigned(
          hospitalData,
          edits,
          year,
          monthIndex,
          day,
          category,
        );

        required += requiredByDay;
        assigned += assignedByDay;
        if (assignedByDay < requiredByDay) {
          deficitDays += 1;
        }
      }

      return {
        category,
        label: formatPresenceCategoryLabel(category),
        required,
        assigned,
        deficitDays,
      };
    })
    .filter((row) => row.required > 0 || row.assigned > 0);
}

export function computeWorkedHours(code) {
  return SHIFT_BY_CODE[(code || "").toUpperCase()]?.hours || 0;
}

export function exportScheduleAsCsv({
  workers,
  monthIndex,
  year,
  getValue,
  filenamePrefix,
}) {
  const daysInCurrentMonth = new Date(year, monthIndex + 1, 0).getDate();
  const headers = ["Trabajador", "Categoria", "Turno base"];
  for (let day = 1; day <= daysInCurrentMonth; day += 1) {
    headers.push(String(day));
  }

  const rows = workers.map((worker) => {
    const row = [worker.name, worker.categoria, worker.turnoBase];
    for (let dayIndex = 0; dayIndex < daysInCurrentMonth; dayIndex += 1) {
      row.push(getValue(worker.name, dayIndex));
    }
    return row;
  });

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenamePrefix}-${year}-${String(monthIndex + 1).padStart(2, "0")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
