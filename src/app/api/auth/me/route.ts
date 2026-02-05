import { NextResponse } from "next/server";

const { prisma } = require("../../../../../src/lib/prisma");
import {
  readAuthTokenFromRequest,
  verifyToken,
} from "../../../../../src/lib/auth.server";

export async function GET(req: Request) {
  try {
    const token = readAuthTokenFromRequest(req);
    if (!token) {
      console.log("Token isnt valid");
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        role: { select: { name: true } },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(
      { user: { ...user, role: user.role.name } },
      { status: 200 }
    );
  } catch {
    //ako token nije dbr - logout
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
