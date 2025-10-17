"use client";

import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <button
      type="button"
      title="Login"
      onClick={() => signIn("google")} // onClick={() => signIn("google", {change state of website here })}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Sign in with Google
    </button>
  );
}
