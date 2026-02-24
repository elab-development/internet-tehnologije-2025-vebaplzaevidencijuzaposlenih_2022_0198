import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "../../tests/helpers/db";

describe("resetDb", () => {
  it("clears tables", async () => {
    await resetDb();

    const role = await prisma.userRole.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: { name: "ADMIN" },
    });

    await prisma.user.create({
      data: {
        firstName: "Test",
        lastName: "Admin",
        email: "a@a.com",
        passwordHash: "x",
        roleId: role.id,
      },
    });

    expect(await prisma.user.count()).toBe(1);

    await resetDb();
    expect(await prisma.user.count()).toBe(0);
  });
});
