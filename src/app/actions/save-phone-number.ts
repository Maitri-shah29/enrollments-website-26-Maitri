"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function savePhoneNumber(phone: string) {
  const trimmedPhone = phone.trim();

  if (!trimmedPhone) {
    return { error: "Phone number is required" };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.userId) {
      return { error: "User is not logged in" };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.session.userId },
      data: { phone: trimmedPhone },
      select: { id: true, phone: true },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Failed to save phone number", error);
    return { error: "Failed to save phone number" };
  }
}
