import { headers } from "next/headers";
import { Suspense } from "react";
import { getAllowedEmailList } from "@/lib/allowed-emails";
import { auth } from "@/lib/auth";
import AccessDenied from "./components/access-denied";
import Landing from "./components/landing";
import { SessionProvider } from "./components/session-provider";
import SignupPage from "./components/sign-up";

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

  if (!session?.session) {
    return (
      <div className="h-screen w-screen">
        <SignupPage />
      </div>
    );
  }

  const email = session.user?.email ?? null;
  const allowedEmails = getAllowedEmailList();
  const normalizedEmail = email?.trim().toLowerCase() ?? null;
  const isAllowed =
    allowedEmails.length === 0 ||
    (normalizedEmail ? allowedEmails.includes(normalizedEmail) : false);

  if (!isAllowed) {
    return (
      <div className="h-screen w-screen">
        <AccessDenied email={email} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <SessionProvider>
        <Landing />
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
