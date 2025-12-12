"use client";

import NetworkGraph from "./network-graph";

type Props = {
  onGetStarted?: () => void;
  loading?: boolean;
  hasRoundUser?: boolean;
  onContinue?: () => void;
};

export default function Home({
  onGetStarted,
  loading = false,
  hasRoundUser = false,
  onContinue,
}: Props) {
  return (
    <div className="relative w-full h-full bg-[#1A1A1A] overflow-hidden flex flex-col items-center justify-center">
      <NetworkGraph />

      <h1
        style={{
          color: "#C8B7FF",
          textAlign: "center",
          fontFamily:
            '"SF Pro", system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"',
          fontSize: "6.25rem", // 100px
          fontStyle: "normal",
          fontWeight: 590,
          lineHeight: "normal",
        }}
        className="px-4 select-none relative z-10 m-0"
      >
        Welcome to
        <br />
        ACM's
        <br />
        Research
      </h1>

      <button
        type="button"
        onClick={hasRoundUser ? onContinue : onGetStarted}
        disabled={loading && !hasRoundUser}
        className="mt-8 px-8 py-3 bg-[#7D5BED] text-white font-medium rounded-md hover:bg-[#6B4DD1] transition-colors relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {hasRoundUser ? "Continue →" : loading ? "Loading..." : "Get Started →"}
      </button>
    </div>
  );
}
