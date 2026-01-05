"use server";
import fetchInterviewRounds from "@/app/actions/fetch-slots";
import SchedulerClient from "@/app/clients/scheduler-client";

export default async function SchedulerServer() {
  const result = await fetchInterviewRounds();
  const rounds = "error" in result ? [] : result.rounds;

  // Initial health check
  let isSfuHealthy = false;
  try {
    const sfuUrl = process.env.NEXT_PUBLIC_SFU_URL || "http://localhost:3031";
    const response = await fetch(`${sfuUrl}/health`, {
      next: { revalidate: 30 },
    });
    if (response.ok) {
      const data = await response.json();
      isSfuHealthy = data.status === "healthy";
    }
  } catch (error) {
    isSfuHealthy = false;
  }

  return (
    <SchedulerClient initialRounds={rounds} initialSfuHealth={isSfuHealthy} />
  );
}
