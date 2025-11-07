"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function submitTask(
  roundUserId: string,
  submitText: string,
) {
  if (!submitText || !roundUserId) {
    throw new Error("Text and roundUserId cannot be empty");
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.session?.userId;
    if (!userId) throw new Error("Not logged in");

    const ru = await prisma.roundUser.findUnique({
      where: { id: roundUserId },
      select: {
        userId: true,
        status: true,
        round: { select: { active: true, hidden: true } },
      },
    });
    if (!ru) throw new Error("Round User does not exist");
    if (ru.userId !== userId) throw new Error("Forbidden");
    if (!ru.round.active || ru.round.hidden)
      throw new Error("Round is not open");
    if (ru.status !== "pending")
      throw new Error("Submissions are not allowed for your status");

    const task = await prisma.task.findUnique({
      where: {
        roundUserId: roundUserId,
      },
    });

    if (!task) throw new Error("Task not found");

    if (task.deadline < new Date()) {
      throw new Error("Deadline already passed");
    }

    const existingSubmission = await prisma.taskSubmission.findUnique({
      where: {
        roundUserId: roundUserId,
      },
    });

    if (existingSubmission) {
      const updatedTask = await prisma.taskSubmission.update({
        where: {
          roundUserId: roundUserId,
        },
        data: {
          text: submitText,
          submittedAt: new Date(),
        },
      });
      return updatedTask;
    } else {
      const newTask = await prisma.taskSubmission.create({
        data: {
          text: submitText,
          roundUserId: roundUserId,
        },
      });
      return newTask;
    }
  } catch (error) {
    console.error("Error in submitTask server action:", error);
    throw error;
  }
}
