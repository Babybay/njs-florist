import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

// ── In-memory fallback ──────────────────────────────────────────────────────
// Fixed-window limiter kept for local dev / single-instance deployments where
// Upstash env vars are absent. NOTE: state is per-process, so it does NOT hold
// across multiple serverless instances — that is exactly why production uses
// Upstash below.
type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

function memoryLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: options.limit - 1, resetAt };
  }

  if (existing.count >= options.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

// ── Upstash (distributed) ───────────────────────────────────────────────────
// Active whenever UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set
// (auto-injected by the Vercel ↔ Upstash Marketplace integration). Works across
// all serverless instances, so the limit is truly global.
const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);
const redis = hasUpstash ? Redis.fromEnv() : null;

// Block repeat offenders without a Redis round-trip. Must live at module scope.
const ephemeralCache = new Map<string, number>();

// Reuse one Ratelimit instance per (limit, window) config.
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  let rl = limiters.get(cacheKey);
  if (!rl) {
    rl = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      ephemeralCache,
      prefix: "njs-rl",
    });
    limiters.set(cacheKey, rl);
  }
  return rl;
}

/**
 * Rate limit `key` to `limit` requests per `windowMs`. Uses Upstash Redis when
 * configured (distributed, production-safe), otherwise an in-memory fallback.
 */
export async function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  if (!redis) return memoryLimit(key, options);

  const { success, remaining, reset } = await getLimiter(
    options.limit,
    options.windowMs,
  ).limit(key);
  return { ok: success, remaining, resetAt: reset };
}

export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}

export function rateLimitResponse(limit: RateLimitResult): Response {
  const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
  return Response.json(
    { error: "Too many requests. Try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(limit.resetAt),
      },
    },
  );
}
