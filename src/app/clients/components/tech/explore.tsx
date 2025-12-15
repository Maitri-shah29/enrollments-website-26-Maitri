"use client";
import type { AOI } from "@/lib/types";

const ALL_AOIS: { aoi: AOI; title: string; description: string }[] = [
  {
    aoi: "app",
    title: "App",
    description:
      "Robust mobile and desktop application development. Join to get exclusive access ",
  },
  {
    aoi: "web",
    title: "Web",
    description: "Full-stack websites and web apps with modern practices.",
  },
  {
    aoi: "gamedev",
    title: "GameDev",
    description: "Unity, Unreal, Godot, and immersive game experiences.",
  },
  {
    aoi: "foss",
    title: "FOSS",
    description:
      "Contributing to open-source projects, version control, and documentation.",
  },
  {
    aoi: "devops",
    title: "DevOps",
    description: "Automation, CI/CD, cloud infra, Docker, Kubernetes, etc.",
  },
];

const AOI_JOIN_LIMIT = 2;

type ExploreAOIsProps = {
  joinedAOIs: Set<AOI>;
  onJoinAOI: (aoi: AOI) => void;
  onLeaveAOI: (aoi: AOI) => void;
};

export default function ExploreAOIs({
  joinedAOIs,
  onJoinAOI,
  onLeaveAOI,
}: ExploreAOIsProps) {
  const joinedCount = joinedAOIs.size;
  const atLimit = joinedCount >= AOI_JOIN_LIMIT;

  return (
    <div className="w-full h-full overflow-y-auto">
      <h1 className="text-[#993C7A] text-3xl font-bold mb-8">
        Explore Areas of Interest
      </h1>
      {atLimit && (
        <div className="text-[#ffafcc] text-lg font-bold mb-6">
          You can join up to {AOI_JOIN_LIMIT} AOIs only. Leave one to join
          another.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ALL_AOIS.map(({ aoi, title, description }) => {
          const isJoined = joinedAOIs.has(aoi);
          const disableJoin = atLimit && !isJoined;
          return (
            <div
              key={aoi}
              className="border-2 h-50 border-[#993C7A] p-6 bg-[#08111D] hover:bg-[#0f1a2b] transition-colors relative flex flex-col items-center"
            >
              <h3 className="text-white text-xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm mb-4">{description}</p>
              <button
                type="button"
                onClick={() => {
                  if (isJoined) {
                    onLeaveAOI(aoi);
                  } else if (!disableJoin) {
                    onJoinAOI(aoi);
                  }
                }}
                disabled={disableJoin}
                className={`absolute bottom-5 w-50 py-2 px-4 font-semibold transition-colors ${
                  isJoined
                    ? "bg-gray-600 hover:bg-gray-700 text-white"
                    : disableJoin
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#993C7A] hover:bg-[#b84a92] text-white"
                }`}
              >
                {isJoined ? "Leave" : disableJoin ? "Limit reached" : "Join"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
