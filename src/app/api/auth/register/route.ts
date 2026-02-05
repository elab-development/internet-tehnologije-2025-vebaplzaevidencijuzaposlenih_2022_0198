import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

const { prisma } = require("../../../../src/lib/prisma");

export async function POST(req: Request) {
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
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      //ovde upisujemo u usera podatke iz selecta
      { user: { ...user, role: user.role.name } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
