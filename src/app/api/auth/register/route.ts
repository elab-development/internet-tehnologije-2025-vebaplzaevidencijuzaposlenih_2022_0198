import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { signToken, setAuthCookie, clearAuthCookie } from "@/lib/auth.server";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  console.log("HIT /api/auth/register POST");

  try {
    const body = await req.json();
    const { email, password, firstName, lastName } = body ?? {};

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    //novi korisnik default ide kao employee.
    const employeeRole = await prisma.userRole.findUnique({
      where: { name: "EMPLOYEE" },
    });
    if (!employeeRole) {
      return NextResponse.json(
        { error: "EMPLOYEE role not seeded" },
        { status: 500 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        roleId: employeeRole.id,
        isActive: true, //ne mora
        //departmentId: null,
        //positionId: null,
        //lastLoginAt: null,
      },
      //bez psw
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        role: { select: { name: true } },
      },
    });

    const token = signToken({ userId: user.id, role: user.role.name });

    const res = NextResponse.json(
      { user: { ...user, role: user.role.name } },
      { status: 201 }
    );

    res.headers.append("Set-Cookie", clearAuthCookie());
    res.headers.append("Set-Cookie", setAuthCookie(token));

    return res;
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
