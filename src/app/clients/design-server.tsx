"use server";
import fetchRoundUser from "@/app/actions/fetch-round-user";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import DesignClient from "@/app/clients/design-client";

export default async function DesignServer() {
  let initialRoundUser: RoundUserExtended | null = null;
  try {
    const roundUser = await fetchRoundUser("design");
    if (roundUser && typeof roundUser === "object" && "id" in roundUser) {
      initialRoundUser = roundUser as RoundUserExtended;
    }
  } catch (e) {
    console.error("Failed to fetch round user on server:", e);
  }

  return <DesignClient initialRoundUser={initialRoundUser} />;
}
