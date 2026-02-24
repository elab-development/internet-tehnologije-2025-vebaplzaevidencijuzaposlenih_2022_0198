export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function isValidTimeHHMM(t: string): boolean {
  return /^\d{2}:\d{2}$/.test(t);
}

export function timeToMinutes(t: string): number {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

export function isValidISODateYYYYMMDD(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const dt = new Date(`${d}T00:00:00.000Z`);
  return !Number.isNaN(dt.getTime());
}
