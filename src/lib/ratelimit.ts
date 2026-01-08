import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RatelimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // unix ms
};

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  upstashUrl && upstashToken
    ? new Redis({ url: upstashUrl, token: upstashToken })
    : null;

let saveResponseLimiter: Ratelimit | null = null;
let actionProxyLimiter: Ratelimit | null = null;

function getSaveResponseLimiter(): Ratelimit | null {
  if (!redis) return null;
  if (!saveResponseLimiter) {
    saveResponseLimiter = new Ratelimit({
      redis,
      prefix: "ratelimit:save-response",
      limiter: Ratelimit.slidingWindow(20, "10 s"),
      analytics: true,
    });
  }
  return saveResponseLimiter;
}

function getActionProxyLimiter(): Ratelimit | null {
  if (!redis) return null;
  if (!actionProxyLimiter) {
    actionProxyLimiter = new Ratelimit({
      redis,
      prefix: "ratelimit:server-actions",
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      analytics: true,
    });
  }
  return actionProxyLimiter;
}

export function getClientIpFromHeaders(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return null;
}

export async function enforceSaveResponseRateLimit(
  key: string,
): Promise<RatelimitResult> {
  const limiter = getSaveResponseLimiter();
  if (!limiter) {
    return {
      success: true,
      limit: Number.POSITIVE_INFINITY,
      remaining: Number.POSITIVE_INFINITY,
      reset: Date.now(),
    };
  }

  const result = await limiter.limit(key);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export async function enforceActionProxyRateLimit(
  key: string,
): Promise<RatelimitResult> {
  const limiter = getActionProxyLimiter();
  if (!limiter) {
    return {
      success: true,
      limit: Number.POSITIVE_INFINITY,
      remaining: Number.POSITIVE_INFINITY,
      reset: Date.now(),
    };
  }

  const result = await limiter.limit(key);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function formatRetryAfterSeconds(resetMs: number): number {
  const seconds = Math.ceil((resetMs - Date.now()) / 1000);
  return Number.isFinite(seconds) ? Math.max(1, seconds) : 10;
}
