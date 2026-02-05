import { NextResponse } from "next/server";
import { clearAuthCookie } from "../../../../../src/lib/auth.server";

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.headers.set("Set-Cookie", clearAuthCookie());
  return res;
}
