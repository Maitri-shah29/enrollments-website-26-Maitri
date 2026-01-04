"use server";
import fetchTaskRoundUsers from "@/app/actions/fetch-task-user";
import TaskClient from "@/app/clients/task-client";

export default async function TaskServer() {
  const result = await fetchTaskRoundUsers();
  const roundUsers = result && "roundusers" in result ? result.roundusers : [];

  return <TaskClient initialRoundUsers={roundUsers ?? []} />;
}
