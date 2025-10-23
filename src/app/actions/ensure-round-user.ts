"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ensureRoundUser(roundId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.session?.userId;
    if (!userId) return { error: "Not logged in" } as const;

    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round) return { error: "Round not found" } as const;

    const ru = await prisma.roundUser.upsert({
      where: { roundId_userId: { roundId, userId } },
      update: {},
      create: { roundId, userId },
      select: { id: true },
    });
    return { success: true as const, roundUserId: ru.id };
  } catch (e) {
    console.error("ensureRoundUser error", e);
    return { error: "Failed to ensure round-user mapping" } as const;
  }
}
