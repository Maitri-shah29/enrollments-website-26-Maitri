"use server";
import fetchRoundUser from "@/app/actions/fetch-round-user";
import type { RoundUserExtended } from "@/app/clients/components/research/questions";
import ResearchClient from "@/app/clients/research-client";

export default async function ResearchServer({
  roundUserCount,
}: {
  roundUserCount: number;
}) {
  let initialRoundUser: RoundUserExtended | null = null;
  try {
    const roundUser = await fetchRoundUser("research");
    if (roundUser && typeof roundUser === "object" && "id" in roundUser) {
      initialRoundUser = roundUser as RoundUserExtended;
    }
  } catch (e) {
    console.error("Failed to fetch round user on server:", e);
  }
  return (
    <ResearchClient
      initialRoundUser={initialRoundUser}
      roundUserCount={roundUserCount}
    />
  );
}
