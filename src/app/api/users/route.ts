// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import prismaModule from "@/lib/prisma";
import { requireRole } from "@/lib/auth.guard";
import bcrypt from "bcrypt";
import type { Prisma } from "@prisma/client";

const { prisma } = prismaModule;

type RoleName = "EMPLOYEE" | "MANAGER" | "ADMIN";

type UserListItem = Prisma.UserGetPayload<{
  select: {
    id: true;
    firstName: true;
    lastName: true;
    email: true;
    createdAt: true;
    lastLoginAt: true;
    role: { select: { name: true } };
  };
}>;

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function GET(req: Request) {
  console.log("HIT /api/users GET");
  const auth = await requireRole(req, ["ADMIN", "MANAGER"]);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") ?? "dropdown").toLowerCase(); // dropdown | admin
  const q = (url.searchParams.get("q") ?? "").trim();
  const includeInactive = url.searchParams.get("includeInactive") === "true";

  if (mode === "dropdown") {
    const users = await prisma.user.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    return NextResponse.json({ users }, { status: 200 });
  }

  if (mode === "admin") {
    if (auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const users: UserListItem[] = await prisma.user.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [
        { role: { name: "asc" } },
        { firstName: "asc" },
        { lastName: "asc" },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        lastLoginAt: true,
        role: { select: { name: true } },
      },
    });

    const items = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      role: u.role.name as RoleName,
    }));

    return NextResponse.json({ users: items }, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
}

export async function POST(req: Request) {
  console.log("HIT /api/users POST");

  const auth = await requireRole(req, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Neispravan JSON." }, { status: 400 });

  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const roleName = String(body.role ?? "")
    .trim()
    .toUpperCase() as RoleName;
  const password = String(body.password ?? "").trim();

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json(
      { error: "firstName, lastName, email i password su obavezni." },
      { status: 400 }
    );
  }
  if (!isEmail(email)) {
    return NextResponse.json(
      { error: "Email format nije ispravan." },
      { status: 400 }
    );
  }
  if (!["EMPLOYEE", "MANAGER", "ADMIN"].includes(roleName)) {
    return NextResponse.json({ error: "Uloga nije validna." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Lozinka mora imati bar 6 karaktera." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Korisnik sa tim email-om već postoji." },
      { status: 409 }
    );
  }

  const role = await prisma.userRole.findUnique({ where: { name: roleName } });
  if (!role) {
    return NextResponse.json(
      { error: "Uloga ne postoji u bazi (seed?)." },
      { status: 500 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,

      roleId: role.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
      lastLoginAt: true,
      role: { select: { name: true } },
    },
  });

  await prisma.adminAction.create({
    data: {
      action: "CREATE_USER",
      adminId: auth.userId,
      note: `Created ${created.email} (${created.role.name})`,
    },
  });

  return NextResponse.json(
    {
      user: {
        id: created.id,
        firstName: created.firstName,
        lastName: created.lastName,
        email: created.email,
        createdAt: created.createdAt,
        lastLoginAt: created.lastLoginAt,
        role: created.role.name,
      },
    },
    { status: 201 }
  );
}
