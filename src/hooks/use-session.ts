"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type SessionType = Awaited<ReturnType<typeof authClient.getSession>>;

export function useSession(initialSession?: SessionType) {
  const [session, setSession] = useState<SessionType>(() => {
    if (!initialSession) return null;
    if ("data" in initialSession) return initialSession;
    return { data: initialSession, error: null } as unknown as SessionType;
  });
  const [isPending, setIsPending] = useState(initialSession === undefined);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const currentSession = await authClient.getSession();
        if (isMounted) setSession(currentSession);
      } catch (error) {
        console.error("Error fetching session:", error);
        if (isMounted) setSession(null);
      } finally {
        if (isMounted) setIsPending(false);
      }
    };

    // Initial fetch
    checkSession();

    // Detect session changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "better-auth-session-trigger") {
        checkSession();
      }
    };

    // Detect login/logout in SAME tab
    const handleLocalAuthEvent = () => {
      checkSession();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("better-auth-session-change", handleLocalAuthEvent);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "better-auth-session-change",
        handleLocalAuthEvent,
      );
    };
  }, []);

  return { data: session, isPending };
}
