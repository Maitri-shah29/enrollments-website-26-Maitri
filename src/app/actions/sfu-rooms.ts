"use server";

import { auth } from "@/lib/auth";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import type { GetRoomsResponse } from "@/lib/sfu-types";
import { headers } from "next/headers";
import { getAggregatedRooms } from "@/lib/sfu-allocator";

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

  const rooms = await getAggregatedRooms();
  return { rooms };
}
