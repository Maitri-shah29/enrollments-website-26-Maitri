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
  let promotedDomains: string[] = [];
  const userId = session?.session?.userId;
  if (userId) {
    [roundUserCount, promotedDomains] = await Promise.all([
      getRoundUserCountCached(userId),
      getPromotedDomainsCached(userId),
    ]);
  }
  return (
    <SessionProvider initialSession={session}>
      <Landing
        session={session}
        initialUrl={initialUrl}
        isAllowed={true}
        promotedDomains={promotedDomains}
        designChild={
          <DesignServer
            roundUserCount={roundUserCount}
            hasPromotedRound1={promotedDomains.includes("design")}
          />
        }
        managementChild={
          <ManagementServer
            roundUserCount={roundUserCount}
            hasPromotedRound1={promotedDomains.includes("management")}
          />
        }
        techChild={
          <TechServer
            roundUserCount={roundUserCount}
            hasPromotedRound1={promotedDomains.includes("tech")}
          />
        }
        researchChild={
          <ResearchServer
            roundUserCount={roundUserCount}
            hasPromotedRound1={promotedDomains.includes("research")}
          />
        }
        schedulerChild={<SchedulerServer />}
        taskChild={<TaskServer />}
        ccChild={
          <CCServer
            roundUserCount={roundUserCount}
            hasPromotedRound1={promotedDomains.includes("cc")}
          />
        }
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

async function getPromotedDomainsCached(userId: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 600 });
  cacheTag(cacheTags.homePromotedDomains(userId));

  const roundUsers = await prisma.roundUser.findMany({
    where: {
      userId,
      status: "promoted",
      round: {
        number: 1,
        type: "form",
      },
    },
    select: {
      round: {
        select: {
          domain: true,
        },
      },
    },
  });

  const unique = new Set(
    roundUsers.map((entry) => entry.round.domain.toLowerCase()),
  );
  return Array.from(unique);
}
