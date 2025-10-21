"use client";
import Image from "next/image";
import type React from "react";
import { authClient, signIn } from "@/lib/auth-client";

interface SignupPageProps {
  onSignIn: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignIn }) => {
  const handleGoogleSignIn = async () => {
    await signIn();
    // onSignIn();
  };
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-gradient-to-br bg-black p-8">
      <div className="text-center mb-12">
        <h1 className="text-7xl font-bold text-white mb-2 tracking-tight">
          OCS&apos;26
        </h1>
      </div>
      <div className="bg-black rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">
          Sign In
        </h2>

        <button
          type="button"
          // onClick={onSignIn}
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-gray-700 border-2 border-gray-600 rounded-lg px-6 py-3 text-gray-200 font-medium text-base hover:bg-gray-600 hover:border-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Image
            src="/google-logo.svg"
            alt="Google logo"
            width={24}
            height={24}
          />
          Sign in Using Google
        </button>
      </div>
    </div>
  );
};

export default SignupPage;
