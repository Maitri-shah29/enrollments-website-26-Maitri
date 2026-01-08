import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  enforceActionProxyRateLimit,
  formatRetryAfterSeconds,
  getClientIpFromHeaders,
} from "@/lib/ratelimit";

async function handleProxy(request: NextRequest) {
  if (request.method !== "POST") return NextResponse.next();
  if (!request.headers.get("next-action")) return NextResponse.next();

  const clientIp = getClientIpFromHeaders(request.headers) || "unknown";
  const result = await enforceActionProxyRateLimit(`ip:${clientIp}`);

  if (result.success) return NextResponse.next();

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

export async function proxy(request: NextRequest) {
  return handleProxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/photos).*)",
  ],
};
