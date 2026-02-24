import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";

type JwtPayload = {
  userId: number;
  role: string;
};

const COOKIE_NAME = "auth_token";

export function signToken(payload: JwtPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing in .env");

  return jwt.sign(payload, secret, { expiresIn: "1d" });
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing in .env");

  return jwt.verify(token, secret) as JwtPayload;
}

export function setAuthCookie(token: string) {
  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie() {
  return serialize(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

// export function readAuthTokenFromRequest(req: Request): string | null {
//   const cookieHeader = req.headers.get("cookie") || "";
//   const cookies = parse(cookieHeader);
//   return cookies[COOKIE_NAME] ?? null;
// }
export function readAuthTokenFromRequest(req: Request): string | null {
  // 1) Cookie
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const fromCookie = cookies[COOKIE_NAME];
  if (fromCookie) return fromCookie;

  // 2) Authorization: Bearer <token>
  const auth =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;

  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
