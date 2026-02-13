require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function startOfWeekMonday(d) {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  const day = x.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; //pomeri na ponedeljak
  x.setUTCDate(x.getUTCDate() + diff);
  return x;
}
function atUTC(dateObj, hhmm) {
  const [hh, mm] = hhmm.split(":").map(Number);
  return new Date(
    Date.UTC(
      dateObj.getUTCFullYear(),
      dateObj.getUTCMonth(),
      dateObj.getUTCDate(),
      hh,
      mm,
      0
    )
  );
}
function dayOnlyUTC(dateObj) {
  return new Date(
    Date.UTC(
      dateObj.getUTCFullYear(),
      dateObj.getUTCMonth(),
      dateObj.getUTCDate()
    )
  );
}

async function upsertLookup(model, name) {
  // model = prisma.userRole / prisma.activityType / prisma.attendanceStatus
  return model.upsert({
    where: { name },
    update: {},
    create: { name },
    select: { id: true, name: true },
  });
}

async function upsertUser({
  firstName,
  lastName,
  email,
  password,
  roleId,
  departmentId,
}) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      roleId,
      departmentId,
      isActive: true,
    },
    create: {
      firstName,
      lastName,
      email,
      passwordHash,
      roleId,
      departmentId,
      isActive: true,
    },
    select: { id: true, email: true },
  });
}

async function createActivityIfNotExists({
  userId,
  typeId,
  dateObj,
  name,
  startHHMM,
  endHHMM,
  description = null,
}) {
  const startTime = atUTC(dateObj, startHHMM);
  const endTime = atUTC(dateObj, endHHMM);
  const date = dayOnlyUTC(dateObj);

  const exists = await prisma.activity.findFirst({
    where: { userId, name, startTime },
    select: { id: true },
  });
  if (exists) return;

  await prisma.activity.create({
    data: {
      userId,
      typeId,
      name,
      description,
      date,
      startTime,
      endTime,
    },
  });
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCheckIn() {
  const hour = randomInt(9, 10);
  const minute = hour === 9 ? randomInt(0, 59) : randomInt(0, 20);
  return { hour, minute };
}

function randomCheckOut() {
  const hour = randomInt(14, 16);
  const minute = randomInt(0, 59);
  return { hour, minute };
}

function utcDateOnly(d) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

function isoDateUTC(d) {
  return d.toISOString().slice(0, 10);
}

async function seedRandomAttendanceForAllUsers() {
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  // poslednjih 15 dana do juce
  const today = utcDateOnly(new Date());
  const endDate = new Date(today);
  endDate.setUTCDate(endDate.getUTCDate() - 1);

  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - 14);

  for (const u of users) {
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const dateStr = isoDateUTC(d);

      const isAbsent = Math.random() < 0.09;

      let startTime = null;
      let endTime = null;
      let statusId = 2;

      if (!isAbsent) {
        const checkIn = randomCheckIn();
        const checkOut = randomCheckOut();

        startTime = new Date(
          `${dateStr}T${String(checkIn.hour).padStart(2, "0")}:${String(
            checkIn.minute
          ).padStart(2, "0")}:00.000Z`
        );

        endTime = new Date(
          `${dateStr}T${String(checkOut.hour).padStart(2, "0")}:${String(
            checkOut.minute
          ).padStart(2, "0")}:00.000Z`
        );

        statusId = checkIn.hour >= 10 ? 3 : 1;
      }

      await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId: u.id,
            date: new Date(`${dateStr}T00:00:00.000Z`),
          },
        },
        update: { startTime, endTime, statusId },
        create: {
          userId: u.id,
          date: new Date(`${dateStr}T00:00:00.000Z`),
          startTime,
          endTime,
          statusId,
        },
      });
    }
  }
}

async function main() {
  // ---------- lookups ----------
  const roleAdmin = await upsertLookup(prisma.userRole, "ADMIN");
  const roleManager = await upsertLookup(prisma.userRole, "MANAGER");
  const roleEmployee = await upsertLookup(prisma.userRole, "EMPLOYEE");

  await upsertLookup(prisma.attendanceStatus, "PRESENT");
  await upsertLookup(prisma.attendanceStatus, "ABSENT");
  await upsertLookup(prisma.attendanceStatus, "LATE");

  const typeWork = await upsertLookup(prisma.activityType, "WORK");
  const typeMeeting = await upsertLookup(prisma.activityType, "MEETING");
  const typePto = await upsertLookup(prisma.activityType, "PTO");
  await upsertLookup(prisma.activityType, "TEAMBUILDING");

  // ---------- users ----------
  // Damjan = ADMIN (default admin)
  const damjan = await upsertUser({
    firstName: "Damjan",
    lastName: "Veselinovic",
    email: "damjan@demo.com",
    password: "Admin123!",
    roleId: roleAdmin.id,
  });

  // Vuk = MANAGER
  const vuk = await upsertUser({
    firstName: "Vuk",
    lastName: "Vasiljevic",
    email: "vuk@demo.com",
    password: "Vuk123@",
    roleId: roleManager.id,
  });

  // EMPLOYEES
  await upsertUser({
    firstName: "Vojislav",
    lastName: "Buduric",
    email: "vojislav@demo.com",
    password: "Vojislav123@",
    roleId: roleEmployee.id,
  });

  await upsertUser({
    firstName: "Jelena",
    lastName: "Ilic",
    email: "jelena.employee@demo.com",
    password: "Employee123@",
    roleId: roleEmployee.id,
  });

  await upsertUser({
    firstName: "Nikola",
    lastName: "Stojanovic",
    email: "nikola.employee@demo.com",
    password: "Employee123@",
    roleId: roleEmployee.id,
  });

  await upsertUser({
    firstName: "Milan",
    lastName: "Admin",
    email: "milan.admin@demo.com",
    password: "Admin123@",
    roleId: roleAdmin.id,
  });

  // ---------- activities (this week) ----------
  const weekMon = startOfWeekMonday(new Date());
  const tue = new Date(weekMon);
  tue.setUTCDate(tue.getUTCDate() + 1);
  const wed = new Date(weekMon);
  wed.setUTCDate(wed.getUTCDate() + 2);
  const thu = new Date(weekMon);
  thu.setUTCDate(thu.getUTCDate() + 3);
  const fri = new Date(weekMon);
  fri.setUTCDate(fri.getUTCDate() + 4);

  // Damjan activities (ADMIN)
  await createActivityIfNotExists({
    userId: damjan.id,
    typeId: typeMeeting.id,
    dateObj: weekMon,
    name: "Standup",
    startHHMM: "09:30",
    endHHMM: "10:00",
  });

  await createActivityIfNotExists({
    userId: damjan.id,
    typeId: typeWork.id,
    dateObj: wed,
    name: "Sprint planning",
    startHHMM: "11:00",
    endHHMM: "12:00",
  });

  await createActivityIfNotExists({
    userId: damjan.id,
    typeId: typeMeeting.id,
    dateObj: thu,
    name: "1:1 meeting",
    startHHMM: "14:00",
    endHHMM: "14:30",
  });

  // Vuk activities (MANAGER)
  await createActivityIfNotExists({
    userId: vuk.id,
    typeId: typeMeeting.id,
    dateObj: tue,
    name: "Team sync",
    startHHMM: "10:00",
    endHHMM: "10:30",
  });

  await createActivityIfNotExists({
    userId: vuk.id,
    typeId: typeWork.id,
    dateObj: thu,
    name: "Code review",
    startHHMM: "15:00",
    endHHMM: "16:00",
  });

  await createActivityIfNotExists({
    userId: vuk.id,
    typeId: typePto.id,
    dateObj: fri,
    name: "PTO (half day)",
    startHHMM: "12:00",
    endHHMM: "16:00",
    description: "Personal time off",
  });

  await seedRandomAttendanceForAllUsers();
}

(async () => {
  try {
    await main();
    console.log("Seed finished");
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
})();
