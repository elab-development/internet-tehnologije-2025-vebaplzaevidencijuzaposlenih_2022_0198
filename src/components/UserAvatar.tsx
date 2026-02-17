"use client";

type UserAvatarProps = {
  firstName?: string;
  lastName?: string;
  email: string;
  size?: number;
};

const BLUE_GRAY_GRADIENTS = [
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
  "linear-gradient(135deg, #475569 0%, #64748b 100%)",
  "linear-gradient(135deg, #334155 0%, #475569 100%)",
  "linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)",
  "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
  "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
];

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getInitials(
  firstName?: string,
  lastName?: string,
  email?: string
): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  const em = email?.trim() ?? "";

  if (first && last) {
    return (first[0] + last[0]).toUpperCase();
  }
  if (first) return first[0].toUpperCase();
  if (last) return last[0].toUpperCase();
  if (em) return em[0].toUpperCase();
  return "?";
}

function getGradientIndex(
  firstName?: string,
  lastName?: string,
  email?: string
): number {
  const key = `${firstName ?? ""}${lastName ?? ""}${email ?? ""}`;
  return simpleHash(key) % BLUE_GRAY_GRADIENTS.length;
}

export default function UserAvatar({
  firstName,
  lastName,
  email,
  size = 38,
}: UserAvatarProps) {
  const initials = getInitials(firstName, lastName, email);
  const gradientIndex = getGradientIndex(firstName, lastName, email);
  const background = BLUE_GRAY_GRADIENTS[gradientIndex];

  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        background,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Arial, sans-serif',
        fontSize: size <= 32 ? 12 : size <= 40 ? 14 : 16,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
