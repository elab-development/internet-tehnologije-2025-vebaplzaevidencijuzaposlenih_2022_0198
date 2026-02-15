import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth.guard";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const userId = (auth as any).userId as number | undefined;
  const role = (auth as any).role as string | undefined;

  if (typeof userId !== "number") {
    return NextResponse.json(
      { error: "Invalid token (missing userId)" },
      { status: 401 }
    );
  }
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const requestId = Number(id);
  if (!Number.isFinite(requestId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json(
      { error: "status must be APPROVED or REJECTED" },
      { status: 400 }
    );
  }

  const existing = await prisma.wfhRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status !== "PENDING") {
    return NextResponse.json(
      { error: "Request already decided" },
      { status: 409 }
    );
  }

  const updated = await prisma.wfhRequest.update({
    where: { id: requestId },
    data: {
      status,
      decidedAt: new Date(),
      decidedById: userId,
    },
    select: {
      id: true,
      status: true,
      decidedAt: true,
      decidedById: true,
    },
  });

  return NextResponse.json({
    ...updated,
    decidedAt: updated.decidedAt ? updated.decidedAt.toISOString() : null,
  });
}
