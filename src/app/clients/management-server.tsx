"use server";
import fetchRoundUser from "@/app/actions/fetch-round-user";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import ManagementClient from "@/app/clients/management-client";

export default async function ManagementServer({
  roundUserCount,
  hasPromotedRound1 = false,
}: {
  roundUserCount: number;
  hasPromotedRound1?: boolean;
}) {
  let initialRoundUser: RoundUserExtended | null = null;
  try {
    const roundUser = await fetchRoundUser("management");
    if (roundUser && typeof roundUser === "object" && "id" in roundUser) {
      initialRoundUser = roundUser as RoundUserExtended;
    }
  } catch (e) {
    console.error("Failed to fetch round user on server:", e);
  }

  //console.log(initialRoundUser);

  return (
    <ManagementClient
      initialRoundUser={initialRoundUser}
      roundUserCount={roundUserCount}
      hasPromotedRound1={hasPromotedRound1}
    />
  );
}
