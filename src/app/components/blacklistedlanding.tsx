import type React from "react";

interface BlacklistedLandingProps {
  url?: string;
}

const BlacklistedLanding: React.FC<BlacklistedLandingProps> = ({ url }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-white px-6 text-center">
      <h1 className="text-4xl font-bold mb-4">🚫 Uh Oh!</h1>

      <p className="text-lg mb-2">
        The website{" "}
        <span className="font-semibold text-red-400">
          {url || "you’re trying to access"}
        </span>
        &nbsp;is either not allowed or doesn’t exist.
      </p>

      <p className="text-sm text-gray-400 mb-6">
        If you want this to be accessible, please contact us at&nbsp;
        <a
          href="https://discord.gg/5q6TGqMsVn"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white"
        >
          our Discord server
        </a>
        .
      </p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
      >
        Go Back / Reload
      </button>
    </div>
  );
};

export default BlacklistedLanding;
