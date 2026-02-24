export function isoZDateTime(dateOnly: string) {
  // dateOnly: "YYYY-MM-DD"
  return `${dateOnly}T00:00:00.000Z`;
}
