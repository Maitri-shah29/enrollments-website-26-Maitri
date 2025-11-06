"use server";

import type { Domain, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "../../lib/auth";

export type RoundWithRelations = Prisma.RoundGetPayload<{
  include: {
    Question: {
      include: {
        round: true;
        validators: true;
      };
    };
    Meet: true;
  };
}>;

export default async function fetchRound(domain: Domain) {
  try {
    const user = await auth.api.getSession({
      headers: await headers(),
    });
    if (!user?.session?.userId) {
      console.error("You are not logged in!");
      return { error: "Not logged in" };
    }
    const rounds = await prisma.round.findMany({
      where: {
        domain: domain,
        hidden: false,
      },
      include: {
        Question: {
          include: {
            round: true,
            validators: true,
          },
        },
        Meet: true,
      },
    });
    return rounds;
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Error fetching rounds");
  }
}
