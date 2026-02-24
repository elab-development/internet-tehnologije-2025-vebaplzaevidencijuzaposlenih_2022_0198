import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/auth.guard";
import { parseDateOnlyUTC, addDaysUTC, toISODateUTC } from "@/lib/date/date";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const country = (url.searchParams.get("country") ?? "RS").toUpperCase();

  if (!from || !to) {
    return NextResponse.json(
      { error: "from i to su obavezni." },
      { status: 400 }
    );
  }

  const fromDt = parseDateOnlyUTC(from);
  const toDt = parseDateOnlyUTC(to);

  if (!fromDt || !toDt) {
    return NextResponse.json(
      { error: "from i to moraju biti u formatu YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const endExclusive = addDaysUTC(toDt, 1);

  const holidays = await prisma.holiday.findMany({
    where: {
      country,
      date: { gte: fromDt, lt: endExclusive },
    },
    orderBy: { date: "asc" },
    select: { date: true, name: true },
  });

  return NextResponse.json({
    holidays: holidays.map((h: any) => ({
      date: h.date.toISOString().slice(0, 10),
      name: h.name,
    })),
  });
}
