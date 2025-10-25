"use client";
import Image from "next/image";
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
    <div className="w-screen h-screen overflow-hidden">
      <Image
        src="/images/backdrop.jpeg"
        alt="Background"
        fill
        quality={100}
        priority
        className="absolute inset-0 -z-10 object-cover"
      />
      <div className="absolute inset-0 -z-9 bg-white/30" />
      <div className="p-5 h-full w-full flex items-center justify-center">
        <Landing />
      </div>
    </div>
  );
}
