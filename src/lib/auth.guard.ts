import { NextResponse } from "next/server";
import { readAuthTokenFromRequest, verifyToken } from "@/lib/auth.server";

//vraca usera iz jwta
export function getAuthUser(req: Request) {
  const token = readAuthTokenFromRequest(req);
  if (!token) return null;

  try {
    const payload = verifyToken(token);
    return payload;
  } catch {
    return null;
  }
}

//mora biti ulogovan
export function requireAuth(req: Request) {
  const user = getAuthUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return user;
}

//401 ako nije ulogovan, 403 ako nema odg ulogu
export function requireRole(req: Request, allowedRoles: string[]) {
  const user = getAuthUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return user;
}
