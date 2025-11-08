import { headers } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import Landing from "./components/landing";
import { SessionProvider } from "./components/session-provider";

export default function Home() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="h-screen w-screen">
      <SessionProvider>
        <Landing session={session} isAllowed={true} />
      </SessionProvider>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-neutral-950 text-white">
      <p>Loading session...</p>
    </div>
  );
}
