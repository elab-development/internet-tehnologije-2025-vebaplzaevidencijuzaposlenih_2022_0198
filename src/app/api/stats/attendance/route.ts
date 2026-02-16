import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth.guard";

function parseDateOnlyUTC(s: string) {
  // "YYYY-MM-DD"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function addDaysUTC(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function yyyymmUTC(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

type JwtPayloadLike = {
  userId: number;
  email?: string;
};

export async function GET(req: Request) {
  const authOrRes = requireAuth(req);

  if (authOrRes instanceof NextResponse) {
    return authOrRes;
  }

  const authUser = authOrRes as JwtPayloadLike;

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.userId },
    include: { role: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const roleName = dbUser.role?.name; // "ADMIN" | "MANAGER" | "EMPLOYEE"

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const userIdParam = searchParams.get("userId");

  if (!fromStr || !toStr) {
    return NextResponse.json(
      { error: "Parametri from i to su obavezni (YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  const from = parseDateOnlyUTC(fromStr);
  const to = parseDateOnlyUTC(toStr);

  if (!from || !to) {
    return NextResponse.json(
      { error: "from/to moraju biti validni u formatu YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const toExclusive = addDaysUTC(to, 1);

  const where: any = {
    date: { gte: from, lt: toExclusive },
  };

  if (roleName === "EMPLOYEE") {
    // Employee uvek samo svoje (ignoriše userId param)
    where.userId = dbUser.id;
  } else {
    // Admin/Manager: ALL ili pojedinačni user
    if (userIdParam && userIdParam !== "ALL") {
      const uid = Number(userIdParam);
      if (!Number.isFinite(uid) || uid <= 0) {
        return NextResponse.json(
          { error: "userId mora biti broj ili ALL." },
          { status: 400 }
        );
      }
      where.userId = uid;
    }
  }

  const rows = await prisma.attendance.findMany({
    where,
    select: {
      date: true,
      status: { select: { name: true } },
    },
  });

  const totals: Record<string, number> = {
    PRESENT: 0,
    LATE: 0,
    ABSENT: 0,
  };

  const byMonth: Record<string, Record<string, number>> = {};

  for (const r of rows) {
    const statusName = String(r.status?.name ?? "").toUpperCase();

    if (totals[statusName] == null) totals[statusName] = 0;
    totals[statusName] += 1;

    const m = yyyymmUTC(r.date);
    if (!byMonth[m]) {
      byMonth[m] = { PRESENT: 0, LATE: 0, ABSENT: 0 };
    }
    if (byMonth[m][statusName] == null) byMonth[m][statusName] = 0;
    byMonth[m][statusName] += 1;
  }

  const months = Object.keys(byMonth).sort();

  return NextResponse.json({
    from: fromStr,
    to: toStr,
    scope:
      roleName === "EMPLOYEE"
        ? { type: "USER", userId: dbUser.id }
        : userIdParam && userIdParam !== "ALL"
        ? { type: "USER", userId: where.userId }
        : { type: "ALL" },
    totals,
    months: months.map((m) => ({
      month: m,
      ...byMonth[m],
    })),
  });
}
