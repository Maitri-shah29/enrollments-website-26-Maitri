"use server";
import { Domain, RoundStatus, RoundType } from "@prisma/client";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function fetchInterviewRounds() {
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

    const domains = Object.values(Domain);

    const rounds = [];

    for (const domain of domains) {
      const interviewRound = await prisma.round.findFirst({
        where: {
          domain: domain,
          type: RoundType.interview,
          active: true,
        },
        select: {
          id: true,
          domain: true,
          number: true,
          Meet: {
            include: {
              Slot: true,
            },
          },
        },
      });

      if (interviewRound) {
        // Check eligibility and create RoundUser if needed
        const previousRoundNumber = interviewRound.number - 1;

        const previousRound = await prisma.round.findFirst({
          where: {
            domain,
            number: previousRoundNumber,
          },
          select: { id: true },
        });

        if (previousRound) {
          const previousRoundUser = await prisma.roundUser.findFirst({
            where: {
              roundId: previousRound.id,
              userId,
            },
            select: { status: true },
          });

          if (previousRoundUser?.status === RoundStatus.promoted) {
            const existing = await prisma.roundUser.findUnique({
              where: {
                roundId_userId: {
                  roundId: interviewRound.id,
                  userId,
                },
              },
            });

            if (!existing) {
              await prisma.roundUser.create({
                data: {
                  roundId: interviewRound.id,
                  userId,
                },
              });
            }
          }
        }

        // Fetch the RoundUser
        const roundUser = await prisma.roundUser.findUnique({
          where: {
            roundId_userId: {
              roundId: interviewRound.id,
              userId,
            },
          },
          include: {
            round: {
              select: {
                number: true,
              },
            },
            Meet_User: {
              include: {
                slot: {
                  include: {
                    meet: true,
                  },
                },
              },
            },
          },
        });

        if (roundUser) {
          rounds.push({
            ...interviewRound,
            RoundUser: [roundUser],
          });
        }
      }
    }
    console.log("Fetched rounds:", rounds);
    return { rounds };
  } catch (e) {
    console.error("Error in fetching the data", e);
    return { error: "Failed to fetch rounds" } as const;
  }
}
