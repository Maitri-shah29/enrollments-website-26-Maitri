"use server";
import { type Domain, RoundType } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function createRoundUser(domain: Domain) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.session?.userId;
    if (!userId) {
      return { error: "Not logged in" } as const;
    }

    const round = await prisma.round.findFirst({
      where: {
        domain,
        number: 1,
        type: RoundType.form,
      },
      select: { id: true },
    });

    if (!round) {
      return { error: "No form round found for this domain" } as const;
    }

    const existingRoundUser = await prisma.roundUser.findFirst({
      where: {
        roundId: round.id,
        userId,
      },
      include: {
        round: {
          include: {
            Question: {
              orderBy: {
                serial: "asc",
              },
            },
          },
        },
        formSubmission: {
          include: {
            responses: true,
          },
        },
        Task: true,
        Meet_User: true,
        user: true,
      },
    });

    if (existingRoundUser) {
      return {
        roundUser: existingRoundUser,
      } as const;
    }

    //wrapping ts inside a transaction to ensure both roundUser and formSubmission are created together
    const newRoundUser = await prisma.$transaction(async (tx) => {
      const roundUser = await tx.roundUser.create({
        data: {
          roundId: round.id,
          userId,
        },
        include: {
          round: {
            include: {
              Question: {
                orderBy: {
                  serial: "asc",
                },
              },
            },
          },
          formSubmission: {
            include: {
              responses: true,
            },
          },
          Task: true,
          Meet_User: true,
          user: true,
        },
      });

      const formSubmission = await tx.formSubmission.create({
        data: {
          roundUserId: roundUser.id,
          valid: false,
        },
        include: {
          responses: true,
        },
      });

      // Combine the objects manually instead of fetching again
      return {
        ...roundUser,
        formSubmission,
      };
    });

    return {
      roundUser: newRoundUser,
    } as const;
  } catch (e) {
    console.error("createRoundUser error:", e);
    return { error: "Internal server error" } as const;
  }
}
