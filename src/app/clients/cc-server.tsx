"use server";
import fetchRoundUser from "@/app/actions/fetch-round-user";
import CCClient from "@/app/clients/cc-client";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";

export default async function CCServer({
  roundUserCount,
}: {
  roundUserCount: number;
}) {
  let initialRoundUser: RoundUserExtended | null = null;
  try {
    const roundUser = await fetchRoundUser("cc");
    // fetchRoundUser may return a string (e.g., not logged in); guard against that
    if (roundUser && typeof roundUser === "object" && "id" in roundUser) {
      initialRoundUser = roundUser as RoundUserExtended;
    }
  } catch (e) {
    console.error("Failed to fetch round user on server:", e);
  }

  return (
    <CCClient
      initialRoundUser={initialRoundUser}
      roundUserCount={roundUserCount}
    />
  );
}
