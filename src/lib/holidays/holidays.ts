export type Holiday = { date: string; name: string };

export function startOfYearYMD(year: number): string {
  return `${year}-01-01`;
}

export function endOfYearYMD(year: number): string {
  return `${year}-12-31`;
}

export function mergeUniqueHolidays(a: Holiday[], b: Holiday[]): Holiday[] {
  const seen = new Set<string>();
  const out: Holiday[] = [];

  for (const h of [...a, ...b]) {
    const key = `${h.date}|${h.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  return out;
}
