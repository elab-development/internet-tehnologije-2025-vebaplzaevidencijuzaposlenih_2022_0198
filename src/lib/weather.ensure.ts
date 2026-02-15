import { prisma } from "@/lib/prisma";
import {
  fetchDailyWeatherArchive,
  fetchDailyWeatherForecast,
} from "@/lib/openmeteo";

function ymdTodayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function toUTCDateMidnight(ymd: string) {
  return new Date(ymd + "T00:00:00.000Z");
}

export async function ensureWeatherRangeInDb(params: {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  locationKey: string;
}) {
  const { from, to, locationKey } = params;

  const todayStr = ymdTodayUTC();

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

  let upserted = 0;
  for (const r of rows) {
    const date = toUTCDateMidnight(r.day);

    await prisma.weatherDaily.upsert({
      where: {
        locationKey_date: { locationKey, date },
      },
      update: {
        tempMax: r.tempMax,
        tempMin: r.tempMin,
        precipSum: r.precipSum,
        windMax: r.windMax,
        weatherCode: r.weatherCode,
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
    });

    upserted++;
  }

  return { upserted };
}
