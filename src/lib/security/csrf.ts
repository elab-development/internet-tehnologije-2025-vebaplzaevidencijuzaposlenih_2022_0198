import { NextResponse } from "next/server";

export function enforceCsrf(req: Request) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS")
    return null;

  const origin = req.headers.get("origin");
  if (!origin) return null;

  const xfProto = req.headers.get("x-forwarded-proto");
  const xfHost = req.headers.get("x-forwarded-host");
  const host = req.headers.get("host");

  const proto = xfProto ?? "http";
  const effectiveHost = xfHost ?? host;

  const requestOrigin = effectiveHost
    ? `${proto}://${effectiveHost}`
    : new URL(req.url).origin;
  console.log("CSRF DEBUG", {
    origin,
    reqUrl: req.url,
    host: req.headers.get("host"),
    xfHost: req.headers.get("x-forwarded-host"),
    xfProto: req.headers.get("x-forwarded-proto"),
    appOrigin: process.env.APP_ORIGIN,
  });
  if (origin === requestOrigin) return null;

  const allowed = (process.env.APP_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, "")) // skini trailing /
    .filter(Boolean);

  const normOrigin = origin.replace(/\/+$/, "");

  if (!allowed.includes(normOrigin)) {
    return NextResponse.json({ error: "CSRF blocked" }, { status: 403 });
  }

  return null;
}
