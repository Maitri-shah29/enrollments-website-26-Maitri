"use server";

import { prisma } from "@/lib/prisma";

export default async function submitTask(
  roundUserId: string,
  submitText: string,
) {
  if (!submitText || !roundUserId) {
    throw new Error("Text and roundUserId cannot be empty");
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        roundUserId: roundUserId,
      },
    });

    if (!task) throw new Error("Round User does not exist");

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
