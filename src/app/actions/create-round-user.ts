"use server";
import { type Domain, RoundStatus, RoundType } from "@prisma/client";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache-tags";
import { DOMAIN_CAP } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function createRoundUser(domain: Domain) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.session?.userId;
    if (!userId) {
      return { error: "Not logged in" } as const;
    }

    const roundUserCount = await prisma.roundUser.count({
      where: {
        userId,
        status: { not: "pending" },
        round: {
          number: 1,
          type: "form",
        },
      },
    });

    if (roundUserCount >= DOMAIN_CAP) {
      return {
        error: `You have already enrolled in ${roundUserCount} domains. Maximum is ${DOMAIN_CAP}.`,
      } as const;
    }

    const round = await prisma.round.findFirst({
      where: {
        domain,
        number: 1,
        type: RoundType.form,
        active: true,
        hidden: false,
      },
      select: { id: true, active: true },
    });

    if (!round) {
      return { error: "No form round found for this domain" } as const;
    }

    //dont really need this if statement
    if (round.active) {
      const existingRoundUser = await prisma.roundUser.findFirst({
        where: {
          roundId: round.id,
          userId,
        },
        include: {
          round: true,
          Task: true,
          Meet_User: true,
          user: true,
        },
      });

      if (existingRoundUser) {
        // Only include ques and formsubission if status is pending
        if (existingRoundUser.status === RoundStatus.pending) {
          const roundUserWithDetails = await prisma.roundUser.findFirst({
            where: {
              id: existingRoundUser.id,
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

          updateTag(cacheTags.roundUser(userId, domain));
          updateTag(cacheTags.formSubmission(existingRoundUser.id));

          return {
            roundUser: roundUserWithDetails,
          } as const;
        }

        updateTag(cacheTags.roundUser(userId, domain));
        updateTag(cacheTags.formSubmission(existingRoundUser.id));

        return {
          roundUser: { ...existingRoundUser, formSubmission: null },
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

      updateTag(cacheTags.roundUser(userId, domain));
      updateTag(cacheTags.formSubmission(newRoundUser.id));

      return {
        roundUser: newRoundUser,
      } as const;
    } else {
      return { error: "Round is not active" } as const;
    }
  } catch (e) {
    console.error("createRoundUser error:", e);
    return { error: "Internal server error" } as const;
  }
}
