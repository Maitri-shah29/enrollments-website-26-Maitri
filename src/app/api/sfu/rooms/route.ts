import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ADMIN_EMAILS } from "@/lib/admin-config";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sfuUrl = process.env.NEXT_PUBLIC_SFU_URL || "http://localhost:3031";

  try {
    const response = await fetch(`${sfuUrl}/health`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ rooms: [] }, { status: 200 });
    }

    const data = await response.json();
    const rooms = Array.isArray(data.roomDetails)
      ? data.roomDetails.map((room: { id: string; clients?: number }) => ({
          id: room.id,
          userCount: Number(room.clients ?? 0),
        }))
      : [];

    return NextResponse.json({ rooms });
  } catch (_error) {
    return NextResponse.json({ rooms: [] }, { status: 200 });
  }
}
