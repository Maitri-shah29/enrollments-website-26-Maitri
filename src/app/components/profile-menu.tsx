"use client";
import type React from "react";
import { authClient } from "@/lib/auth-client";
import type { UserAuthDisplayProps } from "../../lib/types";

interface ProfileMenuProps extends UserAuthDisplayProps {
  onLogout: () => void;
  onClose: () => void;
}

const handleGoogleSignIn = async () => {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "/",
  });
};

const unauthenticatedView = () => (
  <div className="flex flex-col items-center gap-4 px-8 py-10 text-white">
    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
      <div className="absolute inset-0 rounded-full border-2 border-white/50" />
      <svg
        className="relative z-10 h-9 w-9 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <title>User icon</title>
        <path
          fillRule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clipRule="evenodd"
        />
      </svg>
    </div>
    <div className="text-center space-y-1">
      <h3 className="text-lg font-semibold">Guest User</h3>
      <p className="text-sm text-white/70 max-w-[14rem]">
        Sign in with Google to access all ACM resources.
      </p>
    </div>
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="rounded-full bg-white/15 px-6 py-2 text-sm font-medium text-white transition hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
    >
      Sign in using Google
    </button>
  </div>
);

const authenticatedView = (
  user: UserAuthDisplayProps["user"],
  onLogout: () => void,
) => (
  <div className="flex flex-col items-center gap-6 px-8 py-10 text-white">
    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
      <div className="absolute inset-0 rounded-full border-2 border-white/50" />
      <div className="relative z-10 flex h-[60%] w-[60%] items-center justify-center rounded-full bg-white/10">
        <span className="text-xl font-semibold text-white">
          {user?.name.charAt(0).toUpperCase()}
        </span>
      </div>
    </div>
    <div className="text-center space-y-1">
      <h3 className="text-lg font-semibold leading-tight">{user?.name}</h3>
      <p className="text-sm text-white/70 leading-tight">{user?.email}</p>
    </div>
    <button
      type="button"
      onClick={onLogout}
      className="text-sm font-semibold text-white underline underline-offset-4 transition hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
    >
      Sign out
    </button>
  </div>
);

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  isAuthenticated,
  user,
  onLogout,
  onClose,
}) => {
  return (
    <>
      {/* Backdrop to close menu on clicking outside the menu and escape */}
      <button
        type="button"
        className="fixed inset-0 z-40 focus:outline-none backdrop-blur-sm bg-black/20"
        aria-label="Close profile menu"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <div className="absolute right-0 top-12 w-72 rounded-3xl bg-[#585858] text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] z-50 overflow-hidden border border-white/10">
        {isAuthenticated
          ? authenticatedView(user, onLogout)
          : unauthenticatedView()}
      </div>
    </>
  );
};

export default ProfileMenu;
