"use client";

interface UserAuthDisplayProps {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  onLogin?: () => void;
}

// Render sign in button or user info based on authentication status
const UserAuthDisplay: React.FC<UserAuthDisplayProps> = ({
  isAuthenticated,
  user,
  onLogin,
}) => {
  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={onLogin}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
        <span className="text-white font-semibold">
          {user?.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-white font-medium">{user?.name}</span>
        <span className="text-gray-400 text-sm">{user?.email}</span>
      </div>
    </div>
  );
};

export default UserAuthDisplay;
