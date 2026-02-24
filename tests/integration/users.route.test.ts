import { describe, it, expect } from "vitest";
import prismaModule from "@/lib/prisma";
import { GET, POST } from "@/app/api/users/route";
import { createUser, createRole } from "../helpers/factories";
import { makeAuthCookie } from "../helpers/auth";

const { prisma } = prismaModule;

describe("/api/users (integration)", () => {
  it("GET dropdown: MANAGER dobija listu (minimal fields)", async () => {
    // roles obično već postoje kroz seed, ali ako ti test DB nema seed,
    // createRole helper (upsert) će to rešiti
    if (createRole) {
      await createRole("ADMIN");
      await createRole("MANAGER");
      await createRole("EMPLOYEE");
    }

    const manager = await createUser("MANAGER");
    await createUser("EMPLOYEE");
    await createUser("ADMIN");

    const cookie = makeAuthCookie({ userId: manager.id, role: "MANAGER" });

    const req = new Request("http://localhost/api/users?mode=dropdown", {
      method: "GET",
      headers: { cookie },
    });

    const res = await GET(req as any);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users.length).toBeGreaterThan(0);

    const u = body.users[0];
    expect(u).toHaveProperty("id");
    expect(u).toHaveProperty("firstName");
    expect(u).toHaveProperty("lastName");
    expect(u).toHaveProperty("email");

    // dropdown ne sme da vraća admin fields
    expect(u).not.toHaveProperty("createdAt");
    expect(u).not.toHaveProperty("lastLoginAt");
    expect(u).not.toHaveProperty("role");
  });

  it("GET admin: ADMIN dobija proširene podatke + role string", async () => {
    if (createRole) {
      await createRole("ADMIN");
      await createRole("MANAGER");
      await createRole("EMPLOYEE");
    }

    const admin = await createUser("ADMIN");
    await createUser("EMPLOYEE");

    const cookie = makeAuthCookie({ userId: admin.id, role: "ADMIN" });

    const req = new Request("http://localhost/api/users?mode=admin", {
      method: "GET",
      headers: { cookie },
    });

    const res = await GET(req as any);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users.length).toBeGreaterThan(0);

    const item = body.users[0];
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("firstName");
    expect(item).toHaveProperty("lastName");
    expect(item).toHaveProperty("email");
    expect(item).toHaveProperty("createdAt");
    expect(item).toHaveProperty("lastLoginAt");
    expect(item).toHaveProperty("role");

    expect(["EMPLOYEE", "MANAGER", "ADMIN"]).toContain(item.role);
  });

  it("GET admin: MANAGER dobija 403 Forbidden.", async () => {
    if (createRole) {
      await createRole("ADMIN");
      await createRole("MANAGER");
      await createRole("EMPLOYEE");
    }

    const manager = await createUser("MANAGER");
    const cookie = makeAuthCookie({ userId: manager.id, role: "MANAGER" });

    const req = new Request("http://localhost/api/users?mode=admin", {
      method: "GET",
      headers: { cookie },
    });

    const res = await GET(req as any);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toBe("Forbidden.");
  });

  it("GET invalid mode: 400 Invalid mode.", async () => {
    if (createRole) {
      await createRole("MANAGER");
    }

    const manager = await createUser("MANAGER");
    const cookie = makeAuthCookie({ userId: manager.id, role: "MANAGER" });

    const req = new Request("http://localhost/api/users?mode=whatever", {
      method: "GET",
      headers: { cookie },
    });

    const res = await GET(req as any);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("Invalid mode.");
  });

  it("GET without auth: 401 Unauthorized", async () => {
    const req = new Request("http://localhost/api/users?mode=dropdown", {
      method: "GET",
    });

    const res = await GET(req as any);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("POST: MANAGER ne može -> 403 Forbidden", async () => {
    if (createRole) {
      await createRole("ADMIN");
      await createRole("MANAGER");
      await createRole("EMPLOYEE");
    }

    const manager = await createUser("MANAGER");
    const cookie = makeAuthCookie({ userId: manager.id, role: "MANAGER" });

    const req = new Request("http://localhost/api/users", {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        firstName: "New",
        lastName: "User",
        email: "new.user@test.com",
        role: "EMPLOYEE",
        password: "Secret123!",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("POST: invalid email -> 400 Email format nije ispravan.", async () => {
    if (createRole) {
      await createRole("ADMIN");
      await createRole("EMPLOYEE");
    }

    const admin = await createUser("ADMIN");
    const cookie = makeAuthCookie({ userId: admin.id, role: "ADMIN" });

    const req = new Request("http://localhost/api/users", {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        firstName: "New",
        lastName: "User",
        email: "bad-email",
        role: "EMPLOYEE",
        password: "Secret123!",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("Email format nije ispravan.");
  });

  it("POST: email exists -> 409", async () => {
    if (createRole) {
      await createRole("ADMIN");
      await createRole("EMPLOYEE");
    }

    const admin = await createUser("ADMIN");

    // napravi postojećeg user-a sa poznatim email-om
    await prisma.user.create({
      data: {
        firstName: "Ex",
        lastName: "Isting",
        email: "exists@test.com",
        passwordHash: "x", // dovoljno za ovaj test
        roleId: (await prisma.userRole.findUnique({
          where: { name: "EMPLOYEE" },
        }))!.id,
      },
    });

    const cookie = makeAuthCookie({ userId: admin.id, role: "ADMIN" });

    const req = new Request("http://localhost/api/users", {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        firstName: "New",
        lastName: "User",
        email: "exists@test.com",
        role: "EMPLOYEE",
        password: "Secret123!",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.error).toBe("Korisnik sa tim email-om već postoji.");
  });

  it("POST: success -> 201 + kreira adminAction", async () => {
    if (createRole) {
      await createRole("ADMIN");
      await createRole("EMPLOYEE");
    }

    const admin = await createUser("ADMIN");
    const cookie = makeAuthCookie({ userId: admin.id, role: "ADMIN" });

    const req = new Request("http://localhost/api/users", {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        firstName: "Nikola",
        lastName: "Nikolic",
        email: "nikola@test.com",
        role: "EMPLOYEE",
        password: "Secret123!",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.user.email).toBe("nikola@test.com");
    expect(body.user.role).toBe("EMPLOYEE");

    const created = await prisma.user.findUnique({
      where: { email: "nikola@test.com" },
      include: { role: true },
    });

    expect(created).toBeTruthy();
    expect(created?.role?.name).toBe("EMPLOYEE");

    const action = await prisma.adminAction.findFirst({
      where: { adminId: admin.id, action: "CREATE_USER" },
      orderBy: { createdAt: "desc" },
    });

    expect(action).toBeTruthy();
    expect(action?.note).toContain("Created nikola@test.com (EMPLOYEE)");
  });
});
