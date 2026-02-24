import { it, expect } from "vitest";
import { prisma } from "@/lib/prisma";

it("connects to test database", async () => {
  const result = await prisma.$queryRaw`SELECT 1 as x`;
  expect((result as any)[0].x).toBe(1);
});
