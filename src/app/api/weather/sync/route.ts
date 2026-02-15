import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth.guard";
import {
  fetchDailyWeatherArchive,
  fetchDailyWeatherForecast,
} from "@/lib/openmeteo";

function toUTCDateMidnight(dateStr: string) {
  return new Date(dateStr + "T00:00:00.000Z");
}

export async function POST(req: Request) {
  await requireRole(req, ["ADMIN"]);

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

  const todayStr = new Date().toISOString().slice(0, 10);

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

    const tomorrow = new Date(todayStr + "T00:00:00.000Z");
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const fore = await fetchDailyWeatherForecast(tomorrowStr, to);

    rows = [...arch, ...fore];
  }

  if (rows.length === 0) {
    return NextResponse.json({ upserted: 0, locationKey });
  }

  let upserted = 0;

  for (const r of rows) {
    const date = toUTCDateMidnight(r.day);

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
