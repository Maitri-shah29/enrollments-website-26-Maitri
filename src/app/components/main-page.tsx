"use client";
import type React from "react";
import { useState } from "react";
import Landing from "./landing";
import SignIn from "./sign-up";

const Page: React.FC = () => {
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
};

export default Page;
