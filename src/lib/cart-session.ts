import { cookies } from "next/headers";

const COOKIE_NAME = "njs_cart_sid";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function randomId() {
  return `sid_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function readCartSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

export async function ensureCartSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const sessionId = randomId();
  jar.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  return sessionId;
}
