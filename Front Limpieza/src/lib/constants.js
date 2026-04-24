export const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const MONTHS_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export const DAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

export const HOSPITAL_OPTIONS = [
  { id: "clinico", label: "H. Clinico" },
  { id: "gil", label: "H. Gil Casares" },
];

export const DETAIL_VIEWS = ["schedule", "coverage", "workers", "hours"];

export const SHIFT_OPTIONS = [
  { code: "M", name: "Manana", group: "Turno", hours: 7, icon: "sun" },
  { code: "T", name: "Tarde", group: "Turno", hours: 7, icon: "sunset" },
  { code: "N", name: "Noche", group: "Turno", hours: 10, icon: "moon" },
  { code: "D", name: "Descanso", group: "Descanso", hours: 0, icon: "rest" },
  { code: "V26", name: "Vacaciones 2026", group: "Vacaciones", hours: 0 },
  { code: "V25", name: "Vacaciones 2025", group: "Vacaciones", hours: 0 },
  { code: "AV", name: "Adicional vac.", group: "Vacaciones", hours: 0 },
  { code: "B", name: "Baja", group: "Ausencia", hours: 7, computa: true },
  { code: "A", name: "Asuntos propios", group: "Permiso", hours: 0 },
  { code: "PF", name: "Permiso familiar", group: "Permiso", hours: 7, computa: true },
  { code: "PS", name: "Permiso sindical", group: "Permiso", hours: 7, computa: true },
  { code: "PR", name: "Permiso retribuido", group: "Permiso", hours: 7, computa: true },
  { code: "L", name: "Lactancia", group: "Permiso", hours: 7, computa: true },
  { code: "RJ", name: "Reduccion jornada", group: "Permiso", hours: 0 },
  { code: "PSS", name: "Permiso sin sueldo", group: "Permiso", hours: 0 },
  { code: "E", name: "Excedencia", group: "Ausencia", hours: 0 },
];

export const SHIFT_BY_CODE = Object.fromEntries(
  SHIFT_OPTIONS.map((shift) => [shift.code, shift]),
);

export const COVERAGE_CATEGORIES = [
  "LIMPIADOR T.M",
  "LIMPIADOR T.T",
  "LIMPIADOR T.N",
  "PEON T.M",
  "PEON T.T",
];

export const FESTIVOS_2026 = new Set([
  "2026-01-01",
  "2026-01-06",
  "2026-04-03",
  "2026-05-01",
  "2026-07-25",
  "2026-08-15",
  "2026-10-12",
  "2026-11-01",
  "2026-12-06",
  "2026-12-08",
  "2026-12-25",
]);
