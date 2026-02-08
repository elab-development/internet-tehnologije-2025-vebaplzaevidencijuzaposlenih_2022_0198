import { NextResponse } from "next/server";
import prismaModule from "@/lib/prisma";
import { requireAuth } from "@/lib/auth.guard";

const { prisma } = prismaModule;

function parseDateOnlyUTC(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDaysUTC(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function toISODateUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayUTCDateOnly(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

function getAuthUserIdAndRole(
  auth: any
): { userId: number; role: string } | null {
  const userId = Number(auth.userId);
  const role = typeof auth.role === "string" ? auth.role : "";
  if (!Number.isInteger(userId) || userId <= 0) return null;
  if (!role) return null;
  return { userId, role };
}

// GET /api/attendance  -> uvek vraća poslednjih 30 dana do danas (UTC date-only)
// (ADMIN/MANAGER mogu: /api/attendance?userId=123)
export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const me = getAuthUserIdAndRole(auth);
  if (!me) {
    return NextResponse.json(
      { error: "Invalid token payload" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const userIdParam = url.searchParams.get("userId");

  // target user
  let targetUserId = me.userId;
  if (me.role === "ADMIN" || me.role === "MANAGER") {
    if (userIdParam) {
      const parsed = Number(userIdParam);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return NextResponse.json(
          { error: "userId must be a positive integer" },
          { status: 400 }
        );
      }
      targetUserId = parsed;
    }
  }

  // poslednjih 30 dana do danas (uključivo), date-only UTC
  const to = todayUTCDateOnly(); // danas 00:00Z
  const from = addDaysUTC(to, -29); // 29 dana unazad (ukupno 30 dana)
  const endExclusive = addDaysUTC(to, 1); // [from, to+1)

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: targetUserId,
      date: { gte: from, lt: endExclusive },
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      totalWorkMinutes: true,
      userId: true,
      status: { select: { name: true } },
    },
  });

  // mapiranje postojećih po datumu
  const byDate = new Map<string, any>();
  for (const a of attendances) {
    const key = toISODateUTC(a.date);
    byDate.set(key, a);
  }

  // popunjena lista od from..to
  const items: any[] = [];
  for (let i = 0; i < 30; i++) {
    const d = addDaysUTC(from, i);
    const dateStr = toISODateUTC(d);

    const a = byDate.get(dateStr);
    if (a) {
      items.push({
        id: a.id,
        date: dateStr,
        startTime: a.startTime ? a.startTime.toISOString() : null,
        endTime: a.endTime ? a.endTime.toISOString() : null,
        totalWorkMinutes: a.totalWorkMinutes ?? null,
        userId: a.userId,
        status: a.status?.name ?? "PRESENT",
      });
    } else {
      // nema zapisa u bazi -> ABSENT
      items.push({
        id: null,
        date: dateStr,
        startTime: null,
        endTime: null,
        totalWorkMinutes: null,
        userId: targetUserId,
        status: "ABSENT",
      });
    }
  }

  return NextResponse.json(
    {
      userId: targetUserId,
      from: toISODateUTC(from),
      to: toISODateUTC(to),
      items,
    },
    { status: 200 }
  );
}
