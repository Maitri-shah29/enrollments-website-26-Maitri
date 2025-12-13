"use server";

import type { Domain, Prisma } from "@prisma/client";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/request-session";

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
    const userId = await getRequestUserId();
    if (!userId) {
      console.error("You are not logged in!");
      return { error: "Not logged in" };
    }

    return getRoundsCached(domain);
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Error fetching rounds");
  }
}

async function getRoundsCached(domain: Domain) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.rounds(domain));

  return prisma.round.findMany({
    where: {
      domain,
      hidden: false,
      active: true,
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
}
