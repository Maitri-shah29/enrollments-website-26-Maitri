import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sfuUrl = process.env.NEXT_PUBLIC_SFU_URL || "http://localhost:3031";

  try {
    const response = await fetch(`${sfuUrl}/health`, {
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: data.status === "healthy" ? "healthy" : "unhealthy",
      });
    }

    return NextResponse.json({ status: "unhealthy" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: "unhealthy" }, { status: 200 });
  }
}
