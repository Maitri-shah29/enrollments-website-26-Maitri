"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type AccessDeniedProps = {
  email?: string | null;
};

const AccessDenied = ({ email }: AccessDeniedProps) => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await authClient.signOut();
      window.dispatchEvent(new Event("better-auth-session-change"));
      localStorage.setItem(
        "better-auth-session-trigger",
        Date.now().toString(),
      );
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white shadow-[0_15px_80px_rgba(0,0,0,0.45)] backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight">
          Access restricted
        </h1>
        <p className="mt-3 text-sm text-white/70">
          {email
            ? `${email} is not approved for this gated deployment.`
            : "Your account is not approved for this gated deployment."}
        </p>
        <p className="mt-1 text-xs text-white/50">
          Please sign in with an email that has been explicitly allow-listed.
        </p>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSigningOut ? "Signing out..." : "Switch Google account"}
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
