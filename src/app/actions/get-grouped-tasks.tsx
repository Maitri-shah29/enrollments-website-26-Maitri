"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type TaskRoundUser = Prisma.RoundUserGetPayload<{
  include: {
    round: true;
    Task: true;
    TaskSubmission: true;
    status: true;
  };
}>;

export type GroupedTasksByDomain = {
  domainName: string;
  domainId: string;
  tasks: TaskRoundUser[];
};

export default async function getGroupedTasks() {
  const user_id_my = "IZmwy2HTQZa3behiMtbIJ5ITYiGjOjG8"; // to add user id from auth api when done;

  try {
    const taskRoundUsers = await prisma.roundUser.findMany({
      where: {
        userId: user_id_my,
        round: {
          type: "task",
        },
      },
      include: {
        round: true,
        Task: true,
        TaskSubmission: true,
      },
    });

    const groupedTasks: GroupedTasksByDomain[] = [];

    taskRoundUsers.forEach((taskRoundUser) => {
      const domainId = taskRoundUser.round.domain || "unknown";
      const domainName = getDomainName(taskRoundUser.round.domain);

      let domainGroup = groupedTasks.find(
        (group) => group.domainId === domainId,
      );

      if (!domainGroup) {
        domainGroup = {
          domainId,
          domainName,
          tasks: [],
        };
        groupedTasks.push(domainGroup);
      }

      domainGroup.tasks.push(taskRoundUser);
    });

    return groupedTasks;
  } catch (error) {
    console.log("Error in loading tasks", error);
    return [];
  }
}

function getDomainName(domain: string): string {
  const domainMap: Record<string, string> = {
    cc: "Competitive Coding",
    design: "Design",
    management: "Management",
    research: "Research",
    tech: "Tech",
  };

  return domainMap[domain] || domain.charAt(0).toUpperCase() + domain.slice(1);
}
