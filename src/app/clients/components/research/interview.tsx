"use client";

import NetworkGraph from "./network-graph";

export default function Interview() {
  return (
    <div className="relative w-full min-h-screen bg-[#1A1A1A] text-white overflow-hidden">
      {/* Background Network Graph (interactive) */}
      <div className="absolute inset-0 z-0">
        <NetworkGraph />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 px-16 py-20 max-w-7xl">
        <h1 className="text-[20px] font-semibold text-[#C8B7FF] mb-4">
          Interview
        </h1>

        <p className="text-gray-300 leading-relaxed text-justify">
          This page will be available after round 1.
        </p>
      </div>
    </div>
  );
}
