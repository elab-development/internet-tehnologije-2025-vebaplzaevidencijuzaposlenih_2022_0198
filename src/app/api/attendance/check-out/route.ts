import { NextResponse } from "next/server";
import prismaModule from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/auth.guard";
import { parseDateOnlyUTC, toISODateUTC } from "@/lib/date/date";
import { getAuthUserIdAndRole } from "@/lib/auth/auth.utils";
const { prisma } = prismaModule;

// POST /api/attendance/check-out
export async function POST(req: Request) {
  console.log("HIT /api/attendance/check-out POST ");

  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const me = getAuthUserIdAndRole(auth);
  if (!me)
    return NextResponse.json(
      { error: "Invalid token payload" },
      { status: 401 }
    );

  const body = await req.json().catch(() => ({}));
  // IDOR: zabrani pokusaj check-outa za drugog korisnika
  if (body?.userId !== undefined || body?.targetUserId !== undefined) {
    return NextResponse.json(
      { error: "Forbidden: cannot check-out for another user." },
      { status: 403 }
    );
  }
  const dateStr = body?.date ? String(body.date) : toISODateUTC(new Date());

  const day = parseDateOnlyUTC(dateStr);
  if (!day) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const record = await prisma.attendance.findUnique({
    where: { userId_date: { userId: me.userId, date: day } },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      status: { select: { name: true } },
      totalWorkMinutes: true,
    },
  });

  if (!record) {
    return NextResponse.json(
      { error: "No attendance record for this day (check-in first)." },
      { status: 409 }
    );
  }
  if (!record.startTime) {
    return NextResponse.json(
      { error: "No check-in time set (check-in first)." },
      { status: 409 }
    );
  }
  if (record.endTime) {
    return NextResponse.json(
      { error: "Already checked out for this day." },
      { status: 409 }
    );
  }

  const now = new Date();
  const diffMs = now.getTime() - record.startTime.getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  const saved = await prisma.attendance.update({
    where: { id: record.id },
    data: {
      endTime: now,
      totalWorkMinutes: minutes,
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
        date: toISODateUTC(saved.date),
        startTime: saved.startTime ? saved.startTime.toISOString() : null,
        endTime: saved.endTime ? saved.endTime.toISOString() : null,
        totalWorkMinutes: saved.totalWorkMinutes ?? null,
        status: saved.status.name,
      },
    },
    { status: 200 }
  );
}
