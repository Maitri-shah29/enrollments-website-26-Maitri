"use server";

import { RoundType } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function fetchTaskRoundUsers() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.session?.userId;

    if (!userId) {
      return {
        error: "Not logged in",
      };
    }

    const roundusers = await prisma.roundUser.findMany({
      where: {
        userId,
        round: {
          type: RoundType.task,
          active: true,
          hidden: false,
        },
        Task: {
          isNot: null,
        },
      },
      include: {
        Task: true,
        TaskSubmission: true,
        round: true,
      },
    });

    return { roundusers };
  } catch (e) {
    console.error("Error in fetching the data", e);
    return { error: "Failed to fetch data" } as const;
  }
}
