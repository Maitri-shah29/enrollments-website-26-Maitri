"use client";
import { createContext, type ReactNode, useContext } from "react";
import { useSession } from "@/hooks/use-session";

type SessionContextType = {
  session: any;
  isPending: boolean;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending } = useSession();

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
