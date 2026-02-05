require("dotenv/config");
console.log("DATABASE_URL loaded:", !!process.env.DATABASE_URL);

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  //FIND test
  const roles = await prisma.userRole.findMany();
  console.log("Roles:", roles);

  //CREATE test
  const team = await prisma.department.upsert({
    where: { name: "IT" },
    update: {},
    create: {
      name: "IT",
      description: "IT Department",
    },
  });
  const activityType = await prisma.activityType.upsert({
    where: { name: "TEAMBUILDING" },
    update: {},
    create: {
      name: "TEAMBUILDING",
    },
  });

  console.log("Created team:", team);
  console.log("Created activity type:", activityType);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
