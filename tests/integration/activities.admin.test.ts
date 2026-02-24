import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/activities/route";
import { createUser, createActivity } from "../helpers/factories";
import { makeAuthCookie } from "../helpers/auth";

describe("GET /api/activities (ADMIN)", () => {
  it("returns activities for all users", async () => {
    const admin = await createUser("ADMIN");
    const u1 = await createUser("EMPLOYEE");
    const u2 = await createUser("EMPLOYEE");

    await createActivity({ userId: u1.id, date: "2026-02-23", name: "U1" });
    await createActivity({ userId: u2.id, date: "2026-02-23", name: "U2" });

    const cookie = makeAuthCookie({
      userId: admin.id,
      role: "ADMIN",
    });

    const req = new Request(
      "http://localhost/api/activities?from=2026-02-23&to=2026-02-23",
      { method: "GET", headers: { cookie } }
    );

    const res = await GET(req as any);
    expect(res.status).toBe(200);

    const body = await res.json();
    const items = Array.isArray(body)
      ? body
      : body.activities ?? body.data ?? body.items;

    expect(Array.isArray(items)).toBe(true);

    const names = items.map((x: any) => x.name).sort();
    expect(names).toEqual(["U1", "U2"]);
  });
});
