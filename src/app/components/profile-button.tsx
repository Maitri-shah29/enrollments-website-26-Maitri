"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import ProfileMenu from "./profile-menu";
import { useSessionContext } from "./session-provider";

const ProfileButton: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ✅ Get session from global context
  const { session, isPending } = useSessionContext();

  // ✅ derived auth state
  const isAuthenticated = !!session?.data?.user;

  const user = isAuthenticated
    ? {
        name: session.data.user.name || "Unknown User",
        email: session.data.user.email || "",
      }
    : null;

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  // ✅ Logout now syncs across ALL tabs + this tab
  const handleLogout = async () => {
    try {
      await authClient.signOut();

      // same-tab update
      window.dispatchEvent(new Event("better-auth-session-change"));

      // cross-tab update
      localStorage.setItem(
        "better-auth-session-trigger",
        Date.now().toString(),
      );

      setIsMenuOpen(false);
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  // ✅ Show loading spinner from session context
  if (isPending) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Profile icon button */}
      <button
        type="button"
        onClick={toggleMenu}
        className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white hover:bg-gray-500 transition-colors"
      >
        {isAuthenticated && user ? (
          <span className="text-sm font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </span>
        ) : (
          /* Guest icon */
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <title>Profile icon</title>
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <ProfileMenu
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
          onClose={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfileButton;
