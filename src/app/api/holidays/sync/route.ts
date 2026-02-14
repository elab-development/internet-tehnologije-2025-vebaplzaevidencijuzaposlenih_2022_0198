import { NextResponse } from "next/server";
import prismaModule from "@/lib/prisma";
import { requireRole } from "@/lib/auth.guard";

const prisma = (prismaModule as any).prisma;
console.log("prisma keys:", Object.keys(prisma ?? {}));
console.log("has holiday:", Boolean((prisma as any)?.holiday));

function dateOnlyUTC(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export async function POST(req: Request) {
  const auth = await requireRole(req, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
  const country = "RS";

  if (!Number.isInteger(year) || year < 1970 || year > 2100) {
    return NextResponse.json({ error: "Year is not valid." }, { status: 400 });
  }

  const apiUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;

  const r = await fetch(apiUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!r.ok) {
    return NextResponse.json(
      { error: `Nager.Date error (${r.status}).` },
      { status: 502 }
    );
  }

  const items = (await r.json()) as Array<{
    date: string; // "YYYY-MM-DD"
    localName: string;
    name: string;
    countryCode: string;
    global: boolean;
    counties: string[] | null;
    types: string[];
  }>;

  const created: number[] = [];
  for (const h of items) {
    const dt = dateOnlyUTC(h.date);

    const row = await prisma.holiday.upsert({
      where: {
        date_country_name: {
          date: dt,
          country,
          name: h.localName ?? h.name,
        },
      },
      create: {
        date: dt,
        country,
        name: h.localName ?? h.name,
        source: "nager",
      },
      update: {
        source: "nager",
      },
      select: { id: true },
    });

    created.push(row.id);
  }

  return NextResponse.json({
    ok: true,
    year,
    country,
    count: items.length,
  });
}
