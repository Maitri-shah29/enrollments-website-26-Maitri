"use server";

import type { Prisma } from "@prisma/client";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/request-session";

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
  const userId = await getRequestUserId();
  if (!userId) {
    console.error("Login to use this feature!");
    return [];
  }

  return getGroupedTasksCached(userId);
}

async function getGroupedTasksCached(userId: string) {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag(cacheTags.tasks(userId));

  try {
    const taskRoundUsers = await prisma.roundUser.findMany({
      where: {
        userId,
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
