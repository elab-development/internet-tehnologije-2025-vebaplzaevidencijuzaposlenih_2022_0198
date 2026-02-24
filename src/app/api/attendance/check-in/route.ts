import { NextResponse } from "next/server";
import prismaModule from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/auth.guard";
import { parseDateOnlyUTC, toISODateUTC } from "@/lib/date/date";
import { getAuthUserIdAndRole } from "@/lib/auth/auth.utils";
import { isLateAfter14Local } from "@/lib/attendance/attendance.utils";
import { enforceCsrf } from "@/lib/security/csrf";
const { prisma } = prismaModule;

// POST /api/attendance/check-in
export async function POST(req: Request) {
  const csrf = enforceCsrf(req);
  if (csrf) return csrf;
  console.log("HIT /api/attendance/check-in POST ");

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const me = getAuthUserIdAndRole(auth);
  if (!me)
    return NextResponse.json(
      { error: "Invalid token payload" },
      { status: 401 }
    );

  const body = await req.json().catch(() => ({}));
  // IDOR : ne dozvoli userId u body-ju
  if (body?.userId !== undefined || body?.targetUserId !== undefined) {
    return NextResponse.json(
      { error: "Forbidden: cannot check-in for another user." },
      { status: 403 }
    );
  }
  const dateStr = body?.date ? String(body.date) : toISODateUTC(new Date()); // danas

  const day = parseDateOnlyUTC(dateStr);
  if (!day) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const now = new Date();
  const statusName = isLateAfter14Local(now) ? "LATE" : "PRESENT";
  console.log("DB URL (server):", process.env.DATABASE_URL);
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
        date: toISODateUTC(saved.date),
        startTime: saved.startTime ? saved.startTime.toISOString() : null,
        endTime: saved.endTime ? saved.endTime.toISOString() : null,
        totalWorkMinutes: saved.totalWorkMinutes ?? null,
        status: saved.status.name,
      },
    },
    { status: 201 }
  );
}
