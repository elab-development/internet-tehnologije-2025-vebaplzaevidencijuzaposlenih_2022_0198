import { NextResponse } from "next/server";
import prismaModule from "@/lib/prisma";
import { requireAuth } from "@/lib/auth.guard";

const { prisma } = prismaModule;
const ALLOWED_STATUSES = new Set(["PRESENT", "ABSENT", "LATE"]);

function parseDateOnlyUTC(dateStr: string): Date | null {
  //YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDaysUTC(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function getAuthUserIdAndRole(
  auth: any
): { userId: number; role: string } | null {
  const userIdRaw = auth.userId; //auth.id;
  console.log(userIdRaw);
  const roleRaw = auth.role;

  const userId = Number(userIdRaw);
  const role = typeof roleRaw === "string" ? roleRaw : "";

  if (!Number.isInteger(userId) || userId <= 0) return null;
  if (!role) return null;

  return { userId, role };
}

// GET /api/attendance?from, to, [&userId=...]
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
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const userIdParam = url.searchParams.get("userId");

  if (!fromStr || !toStr) {
    return NextResponse.json(
      { error: "Missing query params: from, to (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const from = parseDateOnlyUTC(fromStr);
  const to = parseDateOnlyUTC(toStr);

  if (!from || !to) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const endExclusive = addDaysUTC(to, 1);

  // EMPLOYEE moze samo svoje
  // MANAGER/ADMIN - ako userId prosledjen gleda tog usera
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

  return NextResponse.json(
    {
      userId: targetUserId,
      from: fromStr,
      to: toStr,
      items: attendances.map((a: any) => ({
        id: a.id,
        date: a.date.toISOString().slice(0, 10),
        startTime: a.startTime ? a.startTime.toISOString() : null,
        endTime: a.endTime ? a.endTime.toISOString() : null,
        totalWorkMinutes: a.totalWorkMinutes ?? null,
        userId: a.userId,
        status: a.status.name,
      })),
    },
    { status: 200 }
  );
}
