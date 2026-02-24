import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/activities/route";
import { prisma } from "@/lib/prisma";
import { createUser, createActivityType } from "../helpers/factories";
import { makeAuthCookie } from "../helpers/auth";

describe("POST /api/activities", () => {
  it("blocks EMPLOYEE", async () => {
    const emp = await createUser("EMPLOYEE");

    const cookie = makeAuthCookie({ userId: emp.id, role: "EMPLOYEE" });

    const req = new Request("http://localhost/api/activities", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        name: "Should fail",
        date: "2026-02-23T00:00:00.000Z",
        startTime: "2026-02-23T09:00:00.000Z",
        endTime: "2026-02-23T10:00:00.000Z",
      }),
    });

    const res = await POST(req as any);
    expect([401, 403]).toContain(res.status);
  });

  it("allows ADMIN and creates activity", async () => {
    const admin = await createUser("ADMIN");
    await createActivityType("WORK");

    const cookie = makeAuthCookie({ userId: admin.id, role: "ADMIN" });

    const req = new Request("http://localhost/api/activities", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        name: "Created by admin",
        date: "2026-02-23T00:00:00.000Z",
        startTime: "2026-02-23T09:00:00.000Z",
        endTime: "2026-02-23T10:00:00.000Z",
      }),
    });

    const res = await POST(req as any);
    const text = await res.text();
    console.log("POST /api/activities status:", res.status);
    console.log("POST /api/activities body:", text);
    expect([200, 201]).toContain(res.status);

    const count = await prisma.activity.count({
      where: { userId: admin.id, name: "Created by admin" },
    });
    expect(count).toBe(1);
  });
});
