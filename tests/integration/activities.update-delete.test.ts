import { describe, it, expect } from "vitest";
import { PUT, DELETE } from "@/app/api/activities/[id]/route";
import { prisma } from "@/lib/prisma";
import { createUser, createActivity } from "../helpers/factories";
import { makeAuthCookie } from "../helpers/auth";

describe("PUT/DELETE /api/activities/[id]", () => {
  it("blocks EMPLOYEE from updating", async () => {
    const emp = await createUser("EMPLOYEE");
    const act = await createActivity({
      userId: emp.id,
      date: "2026-02-23",
      name: "Old",
    });

    const cookie = makeAuthCookie({ userId: emp.id, role: "EMPLOYEE" });

    const req = new Request(`http://localhost/api/activities/${act.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        name: "New",
        date: "2026-02-23T00:00:00.000Z",
        startTime: "2026-02-23T09:00:00.000Z",
        endTime: "2026-02-23T10:00:00.000Z",
      }),
    });

    const res = await PUT(
      req as any,
      { params: { id: String(act.id) } } as any
    );
    expect([401, 403]).toContain(res.status);
  });

  it("allows ADMIN to update", async () => {
    const admin = await createUser("ADMIN");
    const owner = await createUser("EMPLOYEE");
    const act = await createActivity({
      userId: owner.id,
      date: "2026-02-23",
      name: "Old",
    });

    const cookie = makeAuthCookie({ userId: admin.id, role: "ADMIN" });

    const req = new Request(`http://localhost/api/activities/${act.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        name: "Updated",
        date: "2026-02-23T00:00:00.000Z",
        startTime: "2026-02-23T11:00:00.000Z",
        endTime: "2026-02-23T12:00:00.000Z",
      }),
    });

    const res = await PUT(
      req as any,
      { params: { id: String(act.id) } } as any
    );
    expect([200, 204]).toContain(res.status);

    const updated = await prisma.activity.findUnique({ where: { id: act.id } });
    expect(updated?.name).toBe("Updated");
  });

  it("allows ADMIN to delete", async () => {
    const admin = await createUser("ADMIN");
    const owner = await createUser("EMPLOYEE");
    const act = await createActivity({
      userId: owner.id,
      date: "2026-02-23",
      name: "To delete",
    });

    const cookie = makeAuthCookie({ userId: admin.id, role: "ADMIN" });

    const req = new Request(`http://localhost/api/activities/${act.id}`, {
      method: "DELETE",
      headers: { cookie },
    });

    const res = await DELETE(
      req as any,
      { params: { id: String(act.id) } } as any
    );
    expect([200, 204]).toContain(res.status);

    const exists = await prisma.activity.findUnique({ where: { id: act.id } });
    expect(exists).toBeNull();
  });
});
