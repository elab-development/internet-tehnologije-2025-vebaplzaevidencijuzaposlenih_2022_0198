import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";

import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
} from "../../../../../src/lib/auth.server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    //nije bezbedno otkriti da li je mejl tacan
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (ok) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = signToken({ userId: user.id, role: user.role.name });

    // vracamo user info bez psw i setujemo cookie
    const res = NextResponse.json(
      { user: { id: user.id, email: user.email, role: user.role.name } },
      { status: 200 }
    );

    //httpOnly cookie
    res.headers.append("Set-Cookie", clearAuthCookie());
    res.headers.set("Set-Cookie", setAuthCookie(token));
    return res;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
