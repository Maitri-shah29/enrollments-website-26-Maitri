"use server";
import { Domain, RoundType } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function fetchMeetUser() {
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
    const meetLinks: {
      domain: Domain;
      meetLink: string;
      slot: {
        from: Date;
        to: Date;
        capacity: number;
      } | null;
    }[] = [];
    for (const domain of domains) {
      const interviewRound = await prisma.round.findFirst({
        where: {
          domain: domain,
          type: RoundType.interview,
          active: true,
        },
        select: {
          id: true,
          number: true,
        },
      });

      if (interviewRound) {
        const meetLinkFetch = await prisma.meet.findFirst({
          where: {
            roundId: interviewRound.id,
          },
          select: {
            meetLink: true,
            id: true,
          },
        });

        if (meetLinkFetch) {
          const roundUser = await prisma.roundUser.findFirst({
            where: {
              roundId: interviewRound.id,
              userId: userId,
            },
            select: {
              Meet_User: {
                select: {
                  slot: {
                    select: {
                      from: true,
                      to: true,
                      capacity: true,
                    },
                  },
                },
              },
              
            },
          });

          if (roundUser) {
            const slot = roundUser.Meet_User?.slot ?? null;

            meetLinks.push({
              domain,
              meetLink: meetLinkFetch.meetLink,
              slot: slot,
            });
          }
        }
      }
    }
    return { success: true, meetLinks } as const;
  } catch (e: unknown) {
    console.error("Error in fetching the data", e);
    return { error: "Failed to fetch meet links" } as const;
  }
}
