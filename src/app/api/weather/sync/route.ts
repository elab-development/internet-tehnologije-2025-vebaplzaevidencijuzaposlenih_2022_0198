import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/auth.guard";
import { parseDateOnlyUTC, addDaysUTC, toISODateUTC } from "@/lib/date/date";
import {
  fetchDailyWeatherArchive,
  fetchDailyWeatherForecast,
} from "@/lib/weather/openmeteo";

export async function POST(req: Request) {
  const auth = await requireRole(req, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to"); // YYYY-MM-DD

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing from/to (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const locationKey = process.env.WEATHER_LOCATION_KEY ?? "BELGRADE_OFFICE";

  const todayStr = toISODateUTC(new Date());
  let rows: Array<{
    day: string;
    tempMax: number | null;
    tempMin: number | null;
    precipSum: number | null;
    windMax: number | null;
    weatherCode: number | null;
  }> = [];

  if (to <= todayStr) {
    rows = await fetchDailyWeatherArchive(from, to);
  } else if (from > todayStr) {
    rows = await fetchDailyWeatherForecast(from, to);
  } else {
    const arch = await fetchDailyWeatherArchive(from, todayStr);

    const todayDate = parseDateOnlyUTC(todayStr)!;
    const tomorrowStr = toISODateUTC(addDaysUTC(todayDate, 1));

    const fore = await fetchDailyWeatherForecast(tomorrowStr, to);

    rows = [...arch, ...fore];
  }

  if (rows.length === 0) {
    return NextResponse.json({ upserted: 0, locationKey });
  }

  let upserted = 0;

  for (const r of rows) {
    const date = parseDateOnlyUTC(r.day);
    if (!date) continue;

    await prisma.weatherDaily.upsert({
      where: {
        locationKey_date: { locationKey, date },
      },
      create: {
        locationKey,
        date,
        tempMax: r.tempMax,
        tempMin: r.tempMin,
        precipSum: r.precipSum,
        windMax: r.windMax,
        weatherCode: r.weatherCode,
      },
      update: {
        tempMax: r.tempMax,
        tempMin: r.tempMin,
        precipSum: r.precipSum,
        windMax: r.windMax,
        weatherCode: r.weatherCode,
      },
    });

    upserted++;
  }

  return NextResponse.json({ upserted, locationKey });
}
