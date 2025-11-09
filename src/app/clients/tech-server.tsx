"use server";
import fetchRoundUser from "@/app/actions/fetch-round-user";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import TechWebsite from "@/app/clients/tech-client";

export default async function TechServer() {
  let initialRoundUser: RoundUserExtended | null = null;
  try {
    const roundUser = await fetchRoundUser("tech");
    if (roundUser && typeof roundUser === "object" && "id" in roundUser) {
      initialRoundUser = roundUser as RoundUserExtended;
    }
  } catch (e) {
    console.error("Failed to fetch round user on server:", e);
  }

  console.log(initialRoundUser);

  return <TechWebsite initialRoundUser={initialRoundUser} />;
}
