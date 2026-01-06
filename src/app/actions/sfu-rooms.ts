"use server";

import { auth } from "@/lib/auth";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import type { GetRoomsResponse } from "@/lib/sfu-types";
import { headers } from "next/headers";

export async function getSfuRooms(): Promise<GetRoomsResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!ADMIN_EMAILS.includes(session.user.email)) {
    throw new Error("Forbidden");
  }

  const sfuUrl = process.env.NEXT_PUBLIC_SFU_URL || "http://localhost:3031";

  try {
    const response = await fetch(`${sfuUrl}/health`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return { rooms: [] };
    }

    const data = await response.json();
    const rooms = Array.isArray(data.roomDetails)
      ? data.roomDetails.map((room: { id: string; clients?: number }) => ({
          id: room.id,
          userCount: Number(room.clients ?? 0),
        }))
      : [];

    return { rooms };
  } catch (_error) {
    return { rooms: [] };
  }
}
