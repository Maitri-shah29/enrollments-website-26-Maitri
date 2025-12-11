import { headers } from "next/headers";
import CCServer from "@/app/clients/cc-server";
import DesignServer from "@/app/clients/design-server";
import ManagementServer from "@/app/clients/management-server";
import ResearchServer from "@/app/clients/research-server";
import TechServer from "@/app/clients/tech-server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Landing from "./components/landing";
import { SessionProvider } from "./components/session-provider";

export default async function Home() {
  // Make the root page itself async and fetch session directly
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let roundUserCount = 0;
  if (session?.session?.userId) {
    roundUserCount = await prisma.roundUser.count({
      where: {
        userId: session.session.userId,
        status: { not: "pending" },
        round: {
          number: 1,
          type: "form",
        },
      },
    });

    console.log(roundUserCount);
  }

  return (
    <div className="h-screen w-screen">
      <SessionProvider>
        <Landing
          session={session}
          isAllowed={true}
          ccChild={<CCServer roundUserCount={roundUserCount} />}
          designChild={<DesignServer roundUserCount={roundUserCount} />}
          managementChild={<ManagementServer roundUserCount={roundUserCount} />}
          techChild={<TechServer roundUserCount={roundUserCount} />}
          researchChild={<ResearchServer roundUserCount={roundUserCount} />}
        />
      </SessionProvider>
    </div>
  );
}
