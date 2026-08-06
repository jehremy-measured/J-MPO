const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthName(d: Date): string {
  return MONTHS[d.getMonth()];
}

export function monthNameShort(d: Date): string {
  return MONTHS_SHORT[d.getMonth()];
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isBefore(a: Date, b: Date): boolean {
  return stripTime(a).getTime() < stripTime(b).getTime();
}

export function isAfter(a: Date, b: Date): boolean {
  return stripTime(a).getTime() > stripTime(b).getTime();
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Number of days spanned by [start, end], inclusive. */
export function daysBetweenInclusive(start: Date, end: Date): number {
  const ms = stripTime(end).getTime() - stripTime(start).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function formatShortDate(d: Date): string {
  return `${monthNameShort(d)} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Oct 1 – Dec 31, 2025" or "Dec 15, 2025 – Jan 10, 2026" across years. */
export function formatRangeLabel(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const left = sameYear
    ? `${monthNameShort(start)} ${start.getDate()}`
    : `${monthNameShort(start)} ${start.getDate()}, ${start.getFullYear()}`;
  const right = `${monthNameShort(end)} ${end.getDate()}, ${end.getFullYear()}`;
  return `${left} – ${right}`;
}

/** Generates a Monday-first day grid covering the given month (5 or 6 full weeks). */
export function monthGrid(monthCursor: Date): { date: Date; inMonth: boolean }[] {
  const first = startOfMonth(monthCursor);
  const startOffset = (first.getDay() + 6) % 7; // days since Monday
  const gridStart = addDays(first, -startOffset);
  const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const date = addDays(gridStart, i);
    cells.push({ date, inMonth: date.getMonth() === monthCursor.getMonth() });
  }
  return cells;
}
