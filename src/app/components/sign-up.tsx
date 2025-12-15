"use client";
import Image from "next/image";
import type React from "react";
import { signIn } from "@/lib/auth-client";
import PhoneNumberModal from "./phone-number-modal";

interface SignupPageProps {
  onSignIn: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignIn: _onSignIn }) => {
  const handleGoogleSignIn = async () => {
    await signIn();
    window.dispatchEvent(new Event("better-auth-session-change"));
    localStorage.setItem("showModel", "true");
    // onSignIn();
  };
  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex  items-center justify-center">
      <div className="absolute left-0 top-0 h-full w-1/2 pointer-events-none select-none">
        <Image
          src="/images/acmperson.svg"
          alt="acm person"
          fill
          className="object-cover object-left"
        />
      </div>

      <div className="relative z-10 bg-black/50 rounded-lg flex flex-col justify-center items-center text-center px-6 h-[90%] w-[90%]">
        <Image
          src="/profile-icon-2.svg"
          alt="Profile icon"
          width={120}
          height={120}
          className="mb-6"
        />

        <p className="text-white text-lg mb-6">
          Sign in with your VIT Student email to continue
        </p>

        {/* Google Button */}
        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="w-80 bg-white hover:cursor-pointer text-black font-medium py-3 rounded-xl shadow-md hover:shadow-lg hover:opacity-70 transition-all flex items-center justify-center gap-3"
        >
          <Image
            src="/google-logo-black.svg"
            alt="Google"
            width={22}
            height={22}
          />
          Log in with Google
        </button>
      </div>
    </div>
  );
};

export default SignupPage;
