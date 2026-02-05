const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.userRole.createMany({
    data: [{ name: "ADMIN" }, { name: "MANAGER" }, { name: "EMPLOYEE" }],
    skipDuplicates: true,
  });

  await prisma.attendanceStatus.createMany({
    data: [{ name: "PRESENT" }, { name: "ABSENT" }, { name: "LATE" }],
    skipDuplicates: true,
  });

  await prisma.activityType.createMany({
    data: [{ name: "WORK" }, { name: "MEETING" }, { name: "PTO" }],
    skipDuplicates: true,
  });

  const adminRole = await prisma.userRole.findUnique({
    where: { name: "ADMIN" },
  });
  if (!adminRole) throw new Error("ADMIN role not found (seed roles failed)");

  //default admin user (if not exists)
  const adminEmail = "damjan@demo.com";
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existing) {
    //skinut bcrypt kako se psw ne bi cuvao kao string
    const passwordHash = await bcrypt.hash("Admin123@", 10);

    await prisma.user.create({
      data: {
        firstName: "Damjan",
        lastName: "Veselinovic",
        email: adminEmail,
        passwordHash,
        roleId: adminRole.id,
        isActive: true,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
