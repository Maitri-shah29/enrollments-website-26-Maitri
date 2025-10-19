"use client";
import { useState } from "react";
import ProfileMenu from "./ProfileMenu";

const ProfileButton: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogin = () => {
    // Dummy login, to replace with actual auth logic later very very soon™️.
    setIsAuthenticated(true);
    setUser({
      name: "User Name",
      email: "test@example.com",
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setIsMenuOpen(false);
  };

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
            {/* Profile icon, alternatively u can load a separate SVG file */}
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
          onLogin={handleLogin}
          onLogout={handleLogout}
          onClose={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfileButton;
