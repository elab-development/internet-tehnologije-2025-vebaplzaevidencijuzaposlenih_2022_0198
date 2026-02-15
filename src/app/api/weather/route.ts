import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth.guard";
import { ensureWeatherRangeInDb } from "@/lib/weather.ensure";

function parseYMD(dateStr: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  return new Date(dateStr + "T00:00:00.000Z");
}

export async function GET(req: Request) {
  await requireAuth(req);

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const locationKey =
    searchParams.get("locationKey") ??
    process.env.WEATHER_LOCATION_KEY ??
    "BELGRADE_OFFICE";

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing from/to (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const fromDate = parseYMD(from);
  const toDate = parseYMD(to);

  if (!fromDate || !toDate) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const endExclusive = new Date(toDate);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  let data = await prisma.weatherDaily.findMany({
    where: {
      locationKey,
      date: { gte: fromDate, lt: endExclusive },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      tempMax: true,
      tempMin: true,
      precipSum: true,
      windMax: true,
      weatherCode: true,
    },
  });

  const msPerDay = 24 * 60 * 60 * 1000;
  const expectedDays =
    Math.floor((endExclusive.getTime() - fromDate.getTime()) / msPerDay) || 0;

  if (data.length < expectedDays) {
    await ensureWeatherRangeInDb({ from, to, locationKey });

    data = await prisma.weatherDaily.findMany({
      where: {
        locationKey,
        date: { gte: fromDate, lt: endExclusive },
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        tempMax: true,
        tempMin: true,
        precipSum: true,
        windMax: true,
        weatherCode: true,
      },
    });
  }

  const out = data.map((x: any) => ({
    date: x.date.toISOString().slice(0, 10),
    tempMax: x.tempMax,
    tempMin: x.tempMin,
    precipSum: x.precipSum,
    windMax: x.windMax,
    weatherCode: x.weatherCode,
  }));

  return NextResponse.json(out);
}
