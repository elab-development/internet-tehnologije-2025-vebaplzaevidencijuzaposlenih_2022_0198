import { NextResponse } from "next/server";
import prismaModule from "@/lib/prisma";
import { requireRole } from "@/lib/auth.guard";

const { prisma } = prismaModule;

export async function GET(req: Request) {
  const auth = await requireRole(req, ["ADMIN", "MANAGER"]);
  if (auth instanceof Response) return auth;

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  return NextResponse.json({ users }, { status: 200 });
}
