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
import { DOMAIN_LABELS, DOMAINS, type Domain } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { getRequestSession } from "@/lib/request-session";
import type { DomainResult, ResultsSummary } from "@/lib/results";

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
  let resultsSummary: ResultsSummary | null = null;
  const userId = session?.session?.userId;
  if (userId) {
    [roundUserCount, promotedDomains, resultsSummary] = await Promise.all([
      getRoundUserCountCached(userId),
      getPromotedDomainsCached(userId),
      getResultsSummaryCached(userId),
    ]);
  }
  return (
    <SessionProvider initialSession={session}>
      <Landing
        session={session}
        initialUrl={initialUrl}
        isAllowed={true}
        promotedDomains={promotedDomains}
        resultsSummary={resultsSummary}
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

async function getResultsSummaryCached(
  userId: string,
): Promise<ResultsSummary> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 600 });
  for (const domain of DOMAINS) {
    cacheTag(cacheTags.rounds(domain));
    cacheTag(cacheTags.roundUser(userId, domain));
  }

  const rounds = await prisma.round.findMany({
    select: {
      id: true,
      domain: true,
      number: true,
      type: true,
    },
  });

  const latestByDomain = new Map<string, (typeof rounds)[number]>();
  for (const round of rounds) {
    const domain = round.domain.toLowerCase();
    const existing = latestByDomain.get(domain);
    if (!existing || round.number > existing.number) {
      latestByDomain.set(domain, round);
    }
  }

  const lastRoundIds = Array.from(latestByDomain.values()).map(
    (round) => round.id,
  );
  const roundUsers = lastRoundIds.length
    ? await prisma.roundUser.findMany({
        where: {
          userId,
          roundId: { in: lastRoundIds },
        },
        select: {
          roundId: true,
          status: true,
        },
      })
    : [];

  const statusByRoundId = new Map(
    roundUsers.map((roundUser) => [roundUser.roundId, roundUser.status]),
  );

  const domains: DomainResult[] = DOMAINS.map((domain) => {
    const lastRound = latestByDomain.get(domain);
    const lastRoundNumber = lastRound?.number ?? null;
    const lastRoundType = lastRound?.type ?? null;

    let status: DomainResult["status"] = "pending";
    if (lastRound && lastRound.type === "form") {
      status =
        statusByRoundId.get(lastRound.id) === "promoted"
          ? "promoted"
          : "not_promoted";
    }

    return {
      domain,
      label: DOMAIN_LABELS[domain],
      lastRoundNumber,
      lastRoundType,
      status,
    };
  });

  const promotedSet = domains
    .filter((entry) => entry.status === "promoted")
    .map((entry) => entry.domain);

  const latestRoundUser = await prisma.roundUser.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { round: { select: { domain: true } } },
  });

  const primaryDomain = (latestRoundUser?.round.domain?.toLowerCase() ??
    null) as Domain | null;
  const primaryEntry = primaryDomain
    ? domains.find((entry) => entry.domain === primaryDomain)
    : undefined;

  return {
    domains,
    promotedDomains: promotedSet,
    primaryDomain,
    primaryStatus: primaryEntry?.status ?? "pending",
    primaryLabel: primaryEntry?.label ?? null,
  };
}
