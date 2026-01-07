import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasHealthySfu } from "@/lib/sfu-allocator";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isHealthy = await hasHealthySfu();

  return NextResponse.json(
    { status: isHealthy ? "healthy" : "unhealthy" },
    { status: 200 },
  );
}
