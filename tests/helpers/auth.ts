import { signToken } from "@/lib/auth/auth.server";
import jwt from "jsonwebtoken";

export function makeAuthCookie(payload: any) {
  const token = signToken(payload);
  return `auth_token=${token}`;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "auth_token";

export function signTestToken(payload: { userId: number; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

export function authCookie(payload: { userId: number; role: string }) {
  const token = signTestToken(payload);
  return `${COOKIE_NAME}=${token}`;
}

export function authHeaders(payload: { userId: number; role: string }) {
  const token = signTestToken(payload);
  return {
    Cookie: `${COOKIE_NAME}=${token}`,
    Authorization: `Bearer ${token}`,
  };
}
