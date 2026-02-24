import { NextResponse } from "next/server";

export function enforceCsrf(req: Request) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS")
    return null;

  const origin = req.headers.get("origin");
  if (!origin) return null;

  const requestOrigin = new URL(req.url).origin;
  if (origin === requestOrigin) return null;

  const allowed = (process.env.APP_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!allowed.includes(origin)) {
    return NextResponse.json({ error: "CSRF blocked" }, { status: 403 });
  }

  return null;
}
