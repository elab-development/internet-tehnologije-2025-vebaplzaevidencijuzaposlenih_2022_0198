import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

let userSeq = 1;

export async function createRole(name: string) {
  const existing = await prisma.userRole.findFirst({ where: { name } });
  if (existing) return existing;

  return prisma.userRole.create({ data: { name } });
}

// export async function createUser(roleName: string) {
//   const role = await createRole(roleName);

//   const n = userSeq++;
//   return prisma.user.create({
//     data: {
//       firstName: "Test",
//       lastName: "User",
//       email: `${roleName.toLowerCase()}_${n}@test.com`,
//       passwordHash: "hashed",
//       roleId: role.id,
//     },
//     include: { role: true },
//   });
// }

export async function createUser(
  roleName: string,
  opts?: { password?: string }
) {
  const role = await createRole(roleName);
  const n = userSeq++;

  const password = opts?.password ?? "Test123!";
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      firstName: "Test",
      lastName: "User",
      email: `${roleName.toLowerCase()}_${n}@test.com`,
      passwordHash,
      roleId: role.id,
    },
    include: { role: true },
  });
}
export async function createActivityType(name = "WORK") {
  return prisma.activityType.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

export async function createActivity(params: {
  userId: number;
  date: string; // "YYYY-MM-DD"
  name?: string;
  description?: string;
  start?: string; // "HH:MM"
  end?: string; // "HH:MM"
  typeName?: string; // npr "WORK"
}) {
  const {
    userId,
    date,
    name = "Work",
    description,
    start = "09:00",
    end = "10:00",
    typeName = "WORK",
  } = params;

  const type = await createActivityType(typeName);

  const dt = (d: string, t: string) => new Date(`${d}T${t}:00.000Z`);

  return prisma.activity.create({
    data: {
      name,
      description,
      date: dt(date, "00:00"),
      startTime: dt(date, start),
      endTime: dt(date, end),
      userId,
      typeId: type.id,
    },
    include: { user: true, type: true },
  });
}
export async function createWeatherDaily(params: {
  date: string; // "YYYY-MM-DD"
  locationKey?: string;
  weatherCode?: number;
  precipSum?: number;
  windMax?: number;
  tempMax?: number;
  tempMin?: number;
}) {
  const {
    date,
    locationKey = "BELGRADE_OFFICE",
    weatherCode = 95,
    precipSum = 10,
    windMax = 25,
    tempMax = 5,
    tempMin = 0,
  } = params;

  const day = new Date(`${date}T00:00:00.000Z`);

  return prisma.weatherDaily.upsert({
    where: { locationKey_date: { locationKey, date: day } },
    update: { weatherCode, precipSum, windMax, tempMax, tempMin },
    create: {
      locationKey,
      date: day,
      weatherCode,
      precipSum,
      windMax,
      tempMax,
      tempMin,
    },
  });
}
