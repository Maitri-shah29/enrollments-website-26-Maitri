import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  enforceActionProxyRateLimit,
  enforceProxyRequestRateLimit,
  formatRetryAfterSeconds,
  getClientIpFromHeaders,
} from "@/lib/ratelimit";

function buildRateLimitResponse(result: {
  limit: number;
  remaining: number;
  reset: number;
}) {
  const retryAfterSeconds = formatRetryAfterSeconds(result.reset);
  return new NextResponse("Too Many Requests", {
    status: 429,
    headers: {
      "Retry-After": retryAfterSeconds.toString(),
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.reset.toString(),
    },
  });
}

async function handleProxy(request: NextRequest) {
  const clientIp = getClientIpFromHeaders(request.headers) || "unknown";
  const isActionRequest =
    request.method === "POST" && !!request.headers.get("next-action");

  if (!isActionRequest) {
    if (request.method === "HEAD" || request.method === "OPTIONS") {
      return NextResponse.next();
    }
    const result = await enforceProxyRequestRateLimit(`ip:${clientIp}`);
    if (result.success) return NextResponse.next();
    return buildRateLimitResponse(result);
  }

  const actionResult = await enforceActionProxyRateLimit(`ip:${clientIp}`);
  if (actionResult.success) return NextResponse.next();
  return buildRateLimitResponse(actionResult);
}

export async function proxy(request: NextRequest) {
  return handleProxy(request);
}

export default function middleware(request: NextRequest) {
  return handleProxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/photos).*)",
  ],
};
