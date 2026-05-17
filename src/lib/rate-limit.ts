type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * In-memory fixed-window rate limiter. Sufficient for single-region single-instance
 * Next deployments. Swap to Upstash/Redis for multi-instance.
 */
export function rateLimit(
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
