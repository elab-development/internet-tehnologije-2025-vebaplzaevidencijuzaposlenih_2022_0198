export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function isoToHHMM(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function safeToISOString(d: Date): string | null {
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
export function fmtLocalDateTimeSR(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("sr-RS");
}
