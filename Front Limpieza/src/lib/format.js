export function normalizeText(value) {
  return (value ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function compareNaturalText(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""), "es", {
    numeric: true,
    sensitivity: "base",
  });
}

export function formatHospitalLabel(hospitalId) {
  return hospitalId === "clinico"
    ? "Hospital Clinico"
    : "Hospital Gil Casares";
}

export function formatPresenceCategoryLabel(category) {
  return category
    .replace("LIMPIADOR", "Limpiador")
    .replace("PEON", "Peon")
    .replace("T.M", "· Manana")
    .replace("T.T", "· Tarde")
    .replace("T.N", "· Noche");
}

export function formatDeviation(value) {
  const numeric = Number(value || 0);
  if (numeric > 0) {
    return `+${numeric}h`;
  }

  return `${numeric}h`;
}

export function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 10) / 10}%`;
}
