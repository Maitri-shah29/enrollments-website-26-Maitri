"use server";
import { Domain } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
export default async function fetchRoundUser(domain: string) {
  try {
    const user = await auth.api.getSession({
      headers: await headers(),
    });

    if (!user?.session?.userId) {
      return "user is not logged in!";
    }

    let enumDomain: Domain;
    if (domain.toLowerCase() === "cc") {
      enumDomain = Domain.cc;
    } else if (domain.toLowerCase() === "tech") {
      enumDomain = Domain.tech;
    } else if (domain.toLowerCase() === "research") {
      enumDomain = Domain.research;
    } else if (domain.toLowerCase() === "management") {
      enumDomain = Domain.management;
    } else if (domain.toLowerCase() === "design") {
      enumDomain = Domain.design;
    } else {
      throw new Error("Invalid domain provided");
    }
    // First, check if the round is hidden
    const round = await prisma.round.findFirst({
      where: {
        domain: enumDomain,
        type: "form",
        active: true,
        number: 1,
      },
      select: {
        hidden: true,
      },
    });

    const roundUser = await prisma.roundUser.findFirst({
      where: {
        round: {
          domain: enumDomain,
          type: "form",
          number: 1,
          active: true,
        },
        userId: user.session.userId,
      },
      include: {
        round: {
          include: {
            // Only include questions if round is not hidden
            Question: round?.hidden
              ? false
              : {
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
    return roundUser;
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Error fetching round user");
  }
}
