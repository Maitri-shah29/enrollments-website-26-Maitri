"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import { getSfuForRoom } from "@/lib/sfu-allocator";

const SFU_SECRET = process.env.SFU_SECRET || "development-secret";

export async function getSfuJoinInfo(roomId: string, sessionId: string) {
  if (!roomId) {
    throw new Error("Missing room ID");
  }

  if (!sessionId) {
    throw new Error("Missing session ID");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const isAdmin = ADMIN_EMAILS.includes(session.user.email);
  const token = jwt.sign(
    {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      isAdmin,
      sessionId,
    },
    SFU_SECRET,
    { expiresIn: "1h" },
  );

  const sfu = await getSfuForRoom(roomId);

  return {
    token,
    sfuUrl: sfu.url,
  };
}
