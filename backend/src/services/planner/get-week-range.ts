export function getWeekRange(dateStr: string): { start: Date; end: Date } {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return getWeekRange(now.toISOString().slice(0, 10));
  }

  // ISO week: Monday = 0, Sunday = 6
  const day = d.getUTCDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = (day === 0 ? -6 : 1 - day);

  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diffToMonday, 0, 0, 0));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6, 23, 59, 59, 999));

  return { start, end };
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
