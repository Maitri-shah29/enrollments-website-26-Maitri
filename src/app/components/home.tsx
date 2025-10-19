"use client";
import React, { useState } from "react";
import Landing from "./landing";
import SignIn from "./signup-page";

export default function Home() {
  const [showLanding, setShowLanding] = useState(false);

  return (
    <>
      {showLanding ? (
        <Landing />
      ) : (
        <SignIn onSignIn={() => setShowLanding(true)} />
      )}
    </>
  );
}
