import { compareNaturalText } from "../lib/format";

const API_DATA_URL = "/api/data";
const STATIC_DATA_URL = "/data/dashboard-data.json";

function numberFrom(source, ...keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== "") {
      return Number(source[key]);
    }
  }

  return 0;
}

function stringFrom(source, ...keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== "") {
      return String(source[key]);
    }
  }

  return "";
}

function normalizeWorker(worker, index) {
  return {
    id: `${worker.name || "worker"}-${index}`,
    name: stringFrom(worker, "name"),
    center: stringFrom(worker, "centro"),
    turnoBase: stringFrom(worker, "turnoBase", "turno"),
    puesto: stringFrom(worker, "puesto"),
    categoria: stringFrom(worker, "categoria"),
    annualHours: numberFrom(
      worker,
      "horasAnio",
      "horasA\u00f1o",
      "horasAÃ±o",
      "horasAÃƒÂ±o",
    ),
    observations: stringFrom(worker, "observaciones"),
    plaza: stringFrom(worker, "plazas", "plaza"),
  };
}

function normalizeCoverageFlag(row) {
  const rawValue = row?.cumple ?? row?.meetsCoverage;

  if (typeof rawValue === "boolean") {
    return rawValue ? "SI" : "NO";
  }

  const normalized = String(rawValue ?? "").trim().toUpperCase();
  if (normalized === "TRUE" || normalized === "YES" || normalized === "SI") {
    return "SI";
  }

  if (normalized === "FALSE" || normalized === "NO") {
    return "NO";
  }

  return normalized;
}

function normalizeCoverageRow(row, index) {
  return {
    id: row.id ?? `coverage-${index}`,
    date: stringFrom(row, "fecha", "date"),
    category: stringFrom(row, "categoria", "category"),
    assigned: numberFrom(row, "asignado", "assigned"),
    required: numberFrom(row, "necesario", "required"),
    meetsCoverage: normalizeCoverageFlag(row),
  };
}

function normalizeSummary(summary) {
  return {
    hospital: stringFrom(summary, "hospital"),
    year: numberFrom(summary, "anio", "a\u00f1o", "aÃ±o", "aÃƒÂ±o"),
    summerRule: stringFrom(summary, "regla_verano"),
    totalCoverageGaps: numberFrom(summary, "faltas_cobertura_totales"),
    averageDeviationHours: numberFrom(summary, "desviacion_media_anual_horas"),
  };
}

function normalizeAnnualHours(rawAnnualHours = {}) {
  const normalized = {};

  for (const [workerName, value] of Object.entries(rawAnnualHours)) {
    normalized[workerName] = {
      assigned: numberFrom(value, "asignadas", "assigned"),
      target: numberFrom(value, "objetivo", "target"),
      deviation: numberFrom(value, "desviacion", "deviation"),
    };
  }

  return normalized;
}

function normalizeHospital(key, rawHospital) {
  const workers = Array.isArray(rawHospital?.workers)
    ? rawHospital.workers.map(normalizeWorker).sort((left, right) =>
        compareNaturalText(left.name, right.name),
      )
    : [];

  return {
    key,
    workers,
    monthlySchedule: rawHospital?.monthlySched ?? {},
    coverage: Array.isArray(rawHospital?.coverage)
      ? rawHospital.coverage.map(normalizeCoverageRow)
      : [],
    annualHours: normalizeAnnualHours(rawHospital?.horasAnuales),
    monthlyHours: rawHospital?.horasMensuales ?? {},
    summary: normalizeSummary(rawHospital?.resumen),
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url}`);
  }

  return response.json();
}

function normalizeDashboardData(raw) {
  return {
    hospitals: {
      clinico: normalizeHospital("clinico", raw.clinico),
      gil: normalizeHospital("gil", raw.gil),
    },
    presences: raw.presencias ?? {},
  };
}

export async function loadDashboardData() {
  let raw;
  try {
    raw = await fetchJson(API_DATA_URL);
  } catch (_error) {
    raw = await fetchJson(STATIC_DATA_URL);
  }

  return normalizeDashboardData(raw);
}

export function normalizeLoadedDashboardData(raw) {
  return normalizeDashboardData(raw);
}
