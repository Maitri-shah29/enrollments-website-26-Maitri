"use client"; // Cuz interaction
import type React from "react";
import type { UserAuthDisplayProps } from "../../lib/types";

// ProfileMenu properties
interface ProfileMenuProps extends UserAuthDisplayProps {
  onLogout: () => void;
  onClose: () => void;
}

// View for unauthenticated users, will prompt to login using google.
const unauthenticatedView = (
  onLogin: NonNullable<UserAuthDisplayProps["onLogin"]>,
) => (
  <div className="flex flex-col items-center py-8 px-6">
    <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center mb-4">
      <svg
        className="w-10 h-10 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <title>User icon</title>
        {/* Profile icon, alternatively u can load a separate SVG file */}
        <path
          fillRule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clipRule="evenodd"
        />
      </svg>
    </div>
    <h3 className="text-white text-lg font-medium mb-2">Guest User</h3>
    <p className="text-gray-400 text-sm text-center mb-6">
      Sign in to access all features.
    </p>
    <button
      type="button"
      onClick={onLogin}
      className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded-full transition-colors"
    >
      Sign in using google
    </button>
  </div>
);

// View for authenticated users, shows user info and a sign out button.
const authenticatedView = (
  user: UserAuthDisplayProps["user"],
  onLogout: () => void,
) => (
  <div className="flex flex-col">
    <div className="flex flex-col items-center py-6 px-6 border-b border-gray-700">
      <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center mb-3">
        <span className="text-2xl text-white font-semibold">
          {user?.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <h3 className="text-white text-lg font-medium">{user?.name}</h3>
      <p className="text-gray-400 text-sm">{user?.email}</p>
    </div>
    <div className="p-2">
      <button
        type="button"
        onClick={onLogout}
        className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded transition-colors"
      >
        Sign out
      </button>
    </div>
  </div>
);

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  isAuthenticated,
  user,
  onLogin,
  onLogout,
  onClose,
}) => {
  return (
    <>
      {/* Backdrop to close menu on clicking outside the menu and escape */}
      <button
        type="button"
        className="fixed inset-0 z-40 focus:outline-none"
        aria-label="Close profile menu"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      ></button>
      {/* Load either authenticated or unauthenticated menu as needed */}
      <div className="absolute right-0 top-12 w-80 bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
        {isAuthenticated
          ? authenticatedView(user, onLogout)
          : unauthenticatedView(onLogin!)}
      </div>
    </>
  );
};

export default ProfileMenu;
