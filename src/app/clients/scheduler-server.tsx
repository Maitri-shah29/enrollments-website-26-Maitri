"use server";
import fetchInterviewRounds from "@/app/actions/fetch-slots";
import SchedulerClient from "@/app/clients/scheduler-client";

export default async function SchedulerServer() {
  const result = await fetchInterviewRounds();
  const rounds = "error" in result ? [] : result.rounds;

  return <SchedulerClient initialRounds={rounds} />;
}
