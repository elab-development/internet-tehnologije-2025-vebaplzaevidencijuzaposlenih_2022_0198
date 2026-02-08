import { NextResponse } from "next/server";
import prismaModule from "@/lib/prisma";
import { requireAuth } from "@/lib/auth.guard";

const { prisma } = prismaModule;

function parseDateOnlyUTC(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getAuthUserIdAndRole(
  auth: any
): { userId: number; role: string } | null {
  const userIdRaw = auth.userId; // auth.id
  const roleRaw = auth.role;

  const userId = Number(userIdRaw);
  const role = typeof roleRaw === "string" ? roleRaw : "";

  if (!Number.isInteger(userId) || userId <= 0) return null;
  if (!role) return null;

  return { userId, role };
}

function isLateAfter10Local(now: Date) {
  const hh = now.getHours();
  const mm = now.getMinutes();
  return hh > 10 || (hh === 10 && mm > 0);
}

// POST /api/attendance/check-in
export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const me = getAuthUserIdAndRole(auth);
  if (!me)
    return NextResponse.json(
      { error: "Invalid token payload" },
      { status: 401 }
    );

  const body = await req.json().catch(() => ({}));
  const dateStr = body?.date
    ? String(body.date)
    : new Date().toISOString().slice(0, 10); // danas

  const day = parseDateOnlyUTC(dateStr);
  if (!day) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const now = new Date();
  const statusName = isLateAfter10Local(now) ? "LATE" : "PRESENT";

  const statusRow = await prisma.attendanceStatus.findUnique({
    where: { name: statusName },
    select: { id: true },
  });
  if (!statusRow) {
    return NextResponse.json(
      { error: `AttendanceStatus '${statusName}' not found.` },
      { status: 500 }
    );
  }

  // provera da li vec postoji zapis za taj dan
  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId: me.userId, date: day } },
    select: { id: true, startTime: true, endTime: true },
  });

  if (existing?.startTime) {
    return NextResponse.json(
      { error: "Already checked in for this day." },
      { status: 409 }
    );
  }

  const saved = await prisma.attendance.upsert({
    where: { userId_date: { userId: me.userId, date: day } },
    create: {
      userId: me.userId,
      date: day,
      statusId: statusRow.id,
      startTime: now,
      endTime: null,
      totalWorkMinutes: null,
    },
    update: {
      statusId: statusRow.id,
      startTime: now,
    },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      totalWorkMinutes: true,
      status: { select: { name: true } },
    },
  });

  return NextResponse.json(
    {
      attendance: {
        id: saved.id,
        date: saved.date.toISOString().slice(0, 10),
        startTime: saved.startTime ? saved.startTime.toISOString() : null,
        endTime: saved.endTime ? saved.endTime.toISOString() : null,
        totalWorkMinutes: saved.totalWorkMinutes ?? null,
        status: saved.status.name,
      },
    },
    { status: 201 }
  );
}
