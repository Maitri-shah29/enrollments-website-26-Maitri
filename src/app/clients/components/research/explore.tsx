"use client";
import type { ResearchAOI } from "@/lib/research-navigation";

const ALL_RESEARCH_AOIS: {
  aoi: ResearchAOI;
  title: string;
  description: string;
}[] = [
  {
    aoi: "aiml",
    title: "AI/ML",
    description:
      "Artificial Intelligence and Machine Learning research, including neural networks, deep learning, and intelligent systems.",
  },
  {
    aoi: "cybersecurity",
    title: "Cybersecurity",
    description:
      "Security research covering cryptography, network security, ethical hacking, and threat analysis.",
  },
  {
    aoi: "blockchain",
    title: "Blockchain",
    description:
      "Distributed ledger technology, smart contracts, cryptocurrency, and decentralized applications.",
  },
  {
    aoi: "bioinformatics",
    title: "Bioinformatics",
    description:
      "Computational biology, genomics, protein analysis, and biological data processing.",
  },
  {
    aoi: "quantumcomputing",
    title: "Quantum Computing",
    description:
      "Quantum algorithms, quantum cryptography, and next-generation computational paradigms.",
  },
  {
    aoi: "iot",
    title: "IoT",
    description:
      "Internet of Things, sensor networks, embedded systems, and smart device connectivity.",
  },
];

const AOI_JOIN_LIMIT = 3;

type ExploreResearchAOIsProps = {
  joinedAOIs: Set<ResearchAOI>;
  onJoinAOI: (aoi: ResearchAOI) => void;
  onLeaveAOI: (aoi: ResearchAOI) => void;
};

export default function ExploreResearchAOIs({
  joinedAOIs,
  onJoinAOI,
  onLeaveAOI,
}: ExploreResearchAOIsProps) {
  const joinedCount = joinedAOIs.size;
  const atLimit = joinedCount >= AOI_JOIN_LIMIT;

  return (
    <div className="w-full h-full overflow-y-auto px-8 py-6">
      <h1 className="text-[#9b7fff] text-3xl font-bold mb-4 font-monopoly-bold">
        Explore Research Areas of Interest
      </h1>
      <p className="text-white/80 text-base mb-6 font-monopoly">
        Select up to{" "}
        <span className="text-[#9b7fff] font-semibold">{AOI_JOIN_LIMIT}</span>{" "}
        areas of interest you'd like to participate in. Joining an AOI unlocks
        those questions in Round 1.
        <br />
        You can leave an AOI to join another.
      </p>
      {atLimit && (
        <div className="text-[#c8b7ff] text-lg font-bold mb-6 bg-[#9b7fff]/10 p-4 rounded border border-[#9b7fff]/30 font-monopoly-bold">
          You can join up to {AOI_JOIN_LIMIT} AOIs only. Leave one to join
          another.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ALL_RESEARCH_AOIS.map(({ aoi, title, description }) => {
          const isJoined = joinedAOIs.has(aoi);
          const disableJoin = atLimit && !isJoined;
          return (
            <div
              key={aoi}
              className="border-2 border-[#9b7fff] p-6 bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors rounded"
            >
              <h3 className="text-white text-xl font-semibold mb-3 font-monopoly-bold">
                {title}
              </h3>
              <p className="text-gray-400 text-sm mb-4 min-h-[60px] font-monopoly">
                {description}
              </p>
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
                className={`w-full py-2 px-4 font-semibold transition-colors rounded ${
                  isJoined
                    ? "bg-gray-600 hover:bg-gray-700 text-white"
                    : disableJoin
                      ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                      : "bg-[#9b7fff] hover:bg-[#7d5bed] text-white"
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
