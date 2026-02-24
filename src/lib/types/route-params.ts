export function parseIdParam(id: string): number | null {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}
