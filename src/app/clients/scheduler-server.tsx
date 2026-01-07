"use server";
import fetchInterviewRounds from "@/app/actions/fetch-slots";
import SchedulerClient from "@/app/clients/scheduler-client";
import { hasHealthySfu } from "@/lib/sfu-allocator";

export default async function SchedulerServer() {
  const result = await fetchInterviewRounds();
  const rounds = "error" in result ? [] : result.rounds;

  // Initial health check
  const isSfuHealthy = await hasHealthySfu();

  return (
    <SchedulerClient initialRounds={rounds} initialSfuHealth={isSfuHealthy} />
  );
}
