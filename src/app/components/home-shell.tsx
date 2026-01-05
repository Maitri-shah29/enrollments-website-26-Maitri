import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import CCServer from "@/app/clients/cc-server";
import DesignServer from "@/app/clients/design-server";
import ManagementServer from "@/app/clients/management-server";
import ResearchServer from "@/app/clients/research-server";
import SchedulerServer from "@/app/clients/scheduler-server";
import TaskServer from "@/app/clients/task-server";
import TechServer from "@/app/clients/tech-server";
import Landing from "@/app/components/landing";
import { SessionProvider } from "@/app/components/session-provider";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { getRequestSession } from "@/lib/request-session";

type HomeShellProps = {
  initialUrl?: string;
};

export default function HomeShell({ initialUrl }: HomeShellProps) {
  return (
    <div className="h-screen w-screen">
      <Suspense fallback={<div className="h-screen w-screen bg-neutral-950" />}>
        <HomeWithSession initialUrl={initialUrl} />
      </Suspense>
    </div>
  );
}

async function HomeWithSession({ initialUrl }: HomeShellProps) {
  const session = await getRequestSession();

  let roundUserCount = 0;
  const userId = session?.session?.userId;
  if (userId) {
    roundUserCount = await getRoundUserCountCached(userId);
  }
  return (
    <SessionProvider initialSession={session}>
      <Landing
        session={session}
        initialUrl={initialUrl}
        isAllowed={true}
        ccChild={<CCServer roundUserCount={roundUserCount} />}
        designChild={<DesignServer roundUserCount={roundUserCount} />}
        managementChild={<ManagementServer roundUserCount={roundUserCount} />}
        techChild={<TechServer roundUserCount={roundUserCount} />}
        researchChild={<ResearchServer roundUserCount={roundUserCount} />}
        schedulerChild={<SchedulerServer />}
        taskChild={<TaskServer />}
      />
    </SessionProvider>
  );
}

async function getRoundUserCountCached(userId: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 600 });
  cacheTag(cacheTags.homeRoundUserCount(userId));

  return prisma.roundUser.count({
    where: {
      userId,
      status: { not: "pending" },
      round: {
        number: 1,
        type: "form",
      },
    },
  });
}
