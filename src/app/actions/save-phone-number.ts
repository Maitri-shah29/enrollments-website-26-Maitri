"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";

export default async function savePhoneNumber(phone: string) {
  const trimmedPhone = phone.trim();

  if (!trimmedPhone) {
    return { error: "Phone number is required" };
  }

  // Validate format: must start with '+' and contain only numbers after that
  if (!/^\+\d+$/.test(trimmedPhone)) {
    return {
      error:
        "Invalid phone number format. Must start with '+' followed by digits.",
    };
  }

  // Validate length: Max 16 characters (including +), Min 8 characters
  if (trimmedPhone.length > 16) {
    return { error: "Phone number is too long (max 15 digits)" };
  }
  if (trimmedPhone.length < 8) {
    return { error: "Phone number is too short" };
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

    updateTag(cacheTags.user(session.session.userId));

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Failed to save phone number", error);
    return { error: "Failed to save phone number" };
  }
}
