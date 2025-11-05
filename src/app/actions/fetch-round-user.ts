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
    const roundUser = await prisma.roundUser.findFirst({
      where: {
        round: {
          domain: enumDomain,
          type: "form",
          active: true,
          hidden: false,
        },
        userId: user.session.userId,
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
      },
    });
    return roundUser;
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Error fetching round user");
  }
}
