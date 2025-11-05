"use server";

import type { Domain } from "@prisma/client";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "../../lib/auth";
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
        active: true,
      },
    });
    return rounds;
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Error fetching rounds");
  }
}
