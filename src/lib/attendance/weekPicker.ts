import { addDays } from "@/lib/date/date";

export function startOfWeekMondayLocal(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay(); // 0=ned,1=pon...
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function ymdLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function isSameYMD(a: string, b: string): boolean {
  return a === b;
}

export const weekDayNames = [
  "Pon",
  "Uto",
  "Sre",
  "Čet",
  "Pet",
  "Sub",
  "Ned",
] as const;

export function buildMonthWeeks(year: number, monthIndex0: number): Date[][] {
  const firstOfMonth = new Date(year, monthIndex0, 1);
  const lastOfMonth = new Date(year, monthIndex0 + 1, 0);

  const gridStart = startOfWeekMondayLocal(firstOfMonth);
  const gridEnd = startOfWeekMondayLocal(lastOfMonth);
  const endInclusive = new Date(gridEnd);
  endInclusive.setDate(endInclusive.getDate() + 6);

  const weeks: Date[][] = [];
  for (
    let cur = new Date(gridStart);
    cur <= endInclusive;
    cur.setDate(cur.getDate() + 7)
  ) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(cur);
      d.setDate(d.getDate() + i);
      week.push(d);
    }
    weeks.push(week);
  }
  return weeks;
}

export function isInWorkWeekRange(dayYMD: string, mondayYMD: string): boolean {
  return (
    dayYMD >= mondayYMD && dayYMD <= ymdLocal(addDays(new Date(mondayYMD), 4))
  );
}
