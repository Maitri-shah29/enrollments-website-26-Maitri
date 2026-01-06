"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";

const SFU_SECRET = process.env.SFU_SECRET || "development-secret";

import { ADMIN_EMAILS } from "@/lib/admin-config";

export async function getSfuToken(sessionId: string) {
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
    { expiresIn: "1h" }
  );

  return token;
}
