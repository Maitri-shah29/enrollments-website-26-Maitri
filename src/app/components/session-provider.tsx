"use client";
import { createContext, type ReactNode, useContext } from "react";
import { useSession } from "@/hooks/use-session";

type InitialSession = Parameters<typeof useSession>[0];

type SessionContextType = {
  session: any;
  isPending: boolean;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);
export const SessionProvider = ({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession?: InitialSession;
}) => {
  const { data: session, isPending } = useSession(initialSession);

  return (
    <SessionContext.Provider value={{ session, isPending }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSessionContext must be used within SessionProvider");
  }
  return context;
};
