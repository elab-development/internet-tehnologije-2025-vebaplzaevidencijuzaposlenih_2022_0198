import { describe, it, expect } from "vitest";
import { signToken } from "@/lib/auth/auth.server";
import { createUser } from "../helpers/factories";
import { GET } from "@/app/api/activities/route";

describe("GET /api/activities (unauth)", () => {
  it("returns 401 without auth cookie", async () => {
    const req = new Request(
      "http://localhost/api/activities?from=2026-02-23&to=2026-02-23",
      { method: "GET" }
    );

    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/activities (auth)", () => {
  it("returns 200 for authenticated user", async () => {
    const user = await createUser("ADMIN");

    const token = signToken({
      userId: user.id,
      role: user.role,
    });

    const req = new Request(
      "http://localhost/api/activities?from=2026-02-23&to=2026-02-23",
      {
        method: "GET",
        headers: {
          cookie: `auth_token=${token}`,
        },
      }
    );

    const res = await GET(req as any);

    expect(res.status).toBe(200);
  });
});
