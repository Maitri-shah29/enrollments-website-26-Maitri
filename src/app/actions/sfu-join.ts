"use server";

import jwt from "jsonwebtoken";
import { headers } from "next/headers";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import { auth } from "@/lib/auth";
import { getSfuForRoom } from "@/lib/sfu-allocator";

const SFU_SECRET = process.env.SFU_SECRET || "development-secret";
const SFU_CLIENT_ID = process.env.SFU_CLIENT_ID || "internal";

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
      clientId: SFU_CLIENT_ID,
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
