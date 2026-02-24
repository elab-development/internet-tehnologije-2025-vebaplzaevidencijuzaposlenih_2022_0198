import { NextResponse } from "next/server";
import prismaModule from "@/lib/prisma";
import { requireRole } from "@/lib/auth/auth.guard";

const { prisma } = prismaModule;

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("HIT /api/activities/{id} PUT ");

  const auth = await requireRole(req, ["ADMIN", "MANAGER"]);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const activityId = Number(id);
  if (isNaN(activityId)) {
    return NextResponse.json(
      { error: "Id provided is not a number." },
      { status: 400 }
    );
  }
  const authUserId = Number(auth.userId);
  const authRole = auth.role as "ADMIN" | "MANAGER";

  if (!Number.isInteger(authUserId)) {
    return NextResponse.json(
      { error: "Invalid token payload (missing userId)" },
      { status: 401 }
    );
  }

  const existing = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  if (authRole === "MANAGER" && existing.userId !== authUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, date, startTime, endTime, userId } = body ?? {};

  let parsedDate: Date | undefined;
  let parsedStart: Date | undefined;
  let parsedEnd: Date | undefined;

  if (date !== undefined) {
    const tmp = new Date(date);
    if (isNaN(tmp.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format." },
        { status: 400 }
      );
    }
    parsedDate = tmp;
  }
  if (startTime !== undefined) {
    const tmp = new Date(startTime);
    if (isNaN(tmp.getTime())) {
      return NextResponse.json(
        { error: "Invalid startTime format." },
        { status: 400 }
      );
    }
    parsedStart = tmp;
  }
  if (endTime !== undefined) {
    const tmp = new Date(endTime);
    if (isNaN(tmp.getTime())) {
      return NextResponse.json(
        { error: "Invalid endTime format" },
        { status: 400 }
      );
    }
    parsedEnd = tmp;
  }

  const finalStart = parsedStart;
  const finalEnd = parsedEnd;
  if (finalStart && finalEnd && finalEnd <= finalStart) {
    return NextResponse.json(
      { error: "endTime must be after startTime" },
      { status: 400 }
    );
  }

  if (authRole === "MANAGER" && userId !== undefined) {
    return NextResponse.json(
      { error: "Managers cannot reassign activity owner" },
      { status: 403 }
    );
  }

  const updateData: any = {};

  if (userId !== undefined) {
    const targetUserId = Number(userId);
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isActive: true },
    });

    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json(
        { error: "Target user not found or inactive" },
        { status: 404 }
      );
    }

    updateData.userId = targetUserId;
  }

  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (parsedDate) updateData.date = parsedDate;
  if (parsedStart) updateData.startTime = parsedStart;
  if (parsedEnd) updateData.endTime = parsedEnd;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields provided for update." },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.activity.update({
      where: { id: activityId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        type: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ activity: updated }, { status: 200 });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }
    console.error("PUT ACTIVITY ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("HIT /api/activities/{id} DELETE");

  const auth = await requireRole(req, ["ADMIN", "MANAGER"]);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const activityId = Number(id);
  if (isNaN(activityId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  //IDOR
  const authUserId = Number(auth.userId);
  const authRole = auth.role as "ADMIN" | "MANAGER";

  if (!Number.isInteger(authUserId)) {
    return NextResponse.json(
      { error: "Invalid token payload (missing userId)" },
      { status: 401 }
    );
  }

  const existing = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  if (authRole === "MANAGER" && existing.userId !== authUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.activity.delete({ where: { id: activityId } });
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }
    console.error("DELETE ACTIVITY ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
