import { DAY_LETTERS, FESTIVOS_2026 } from "./constants";

export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function toYmd(year, monthIndex, day) {
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

export function isWeekend(year, monthIndex, day) {
  const weekDay = new Date(year, monthIndex, day).getDay();
  return weekDay === 0 || weekDay === 6;
}

export function isHoliday(year, monthIndex, day) {
  return FESTIVOS_2026.has(toYmd(year, monthIndex, day));
}

export function dayLetter(year, monthIndex, day) {
  return DAY_LETTERS[new Date(year, monthIndex, day).getDay()];
}

export function dayKeyForDate(year, monthIndex, day) {
  if (isHoliday(year, monthIndex, day)) {
    return "Festivos";
  }

  return [
    "Domingo",
    "Lunes",
    "Martes",
    "Miercoles",
    "Jueves",
    "Viernes",
    "Sabado",
  ][new Date(year, monthIndex, day).getDay()];
}
