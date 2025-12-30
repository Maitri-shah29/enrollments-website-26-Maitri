"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";

const SFU_SECRET = process.env.SFU_SECRET || "development-secret";

//grab ts from env
const ADMIN_EMAILS = [
  "ashman.singh2024@vitstudent.ac.in",
  "ashmangamer0406@gmail.com",
];

export async function getSfuToken() {
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
    },
    SFU_SECRET,
    { expiresIn: "1h" }
  );

  return token;
}
