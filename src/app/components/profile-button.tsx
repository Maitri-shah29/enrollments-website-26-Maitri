"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { UserAuthDisplayProps } from "../../lib/types";
import ProfileMenu from "./profile-menu";

const ProfileButton: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserAuthDisplayProps["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Checks the current authentication status cuz
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          setIsAuthenticated(true);
          setUser({
            name: session.data.user.name || "Unknown User",
            email: session.data.user.email || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // logout and close the menu
  const handleLogout = async () => {
    try {
      await authClient.signOut();
      setIsAuthenticated(false);
      window.dispatchEvent(new Event("better-auth-session-change"));

      setUser(null);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  // loading animation as given by gpt
  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
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
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <title>Profile icon</title>
            {/* default guest profile icon as given by gpt my lord and saviour, would prefer custom made svg*/}
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

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
