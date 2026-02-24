export function getAuthUserIdAndRole(
  auth: any
): { userId: number; role: string } | null {
  const userIdRaw = auth?.userId;
  const roleRaw = auth?.role;

  const userId = Number(userIdRaw);
  const role = typeof roleRaw === "string" ? roleRaw : "";

  if (!Number.isInteger(userId) || userId <= 0) return null;
  if (!role) return null;

  return { userId, role };
}
