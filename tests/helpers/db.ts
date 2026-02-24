import { prisma } from "@/lib/prisma";

export async function resetDb() {
  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '_prisma_migrations'
      )
      LOOP
        EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" RESTART IDENTITY CASCADE;';
      END LOOP;
    END $$;
  `);
}

export async function disconnectDb() {
  await prisma.$disconnect();
}
