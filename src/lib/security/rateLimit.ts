type Attempt = {
  count: number;
  firstAttempt: number;
};

const attempts = new Map<string, Attempt>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minuta

export function checkRateLimit(key: string) {
  const now = Date.now();

  const entry = attempts.get(key);

  if (!entry) {
    attempts.set(key, { count: 1, firstAttempt: now });
    return null;
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttempt: now });
    return null;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return {
      error: "Too many attempts. Try again later.",
      status: 429,
    };
  }

  entry.count += 1;
  return null;
}
