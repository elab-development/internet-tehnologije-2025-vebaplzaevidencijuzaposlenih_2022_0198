import { NextResponse } from "next/server";
import { clearAuthCookie } from "../../../../lib/auth/auth.server";

export async function POST() {
  console.log("HIT /api/auth/logout POST");

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.headers.set("Set-Cookie", clearAuthCookie());
  return res;
}
