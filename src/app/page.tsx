"use client";
import { useEffect, useState } from "react";
import { authClient, signIn } from "@/lib/auth-client";
import Landing from "./components/landing";
import SignupPage from "./components/sign-up";

export default function Home() {
  const [session, setSession] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then((s) => {
      setSession(s);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  if (!session) {
    // return <SignupPage onSignIn={() => authClient.signIn("google")} />;
    return <SignupPage onSignIn={signIn} />;
  }

  return (
    <div className="w-screen h-screen">
      <Landing />
    </div>
  );
}
