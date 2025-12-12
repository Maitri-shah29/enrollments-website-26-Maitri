//research-navbar
"use client";

import Image from "next/image";
import type React from "react";
import { useState } from "react";
import type { RoundUserExtended } from "@/app/clients/components/research/questions";
import { DOMAIN_CAP } from "@/lib/constants";
import type { ResearchAOI, ResearchSection } from "@/lib/research-navigation";

const About = "/images/research/about.svg";
const ACM = "/images/research/acm-logo.svg";
const Aoi = "/images/research/aoi.svg";
const Help = "/images/research/help.svg";
const Instructions = "/images/research/instructions.svg";
const Interview = "/images/research/interview.svg";
const RightArrow = "/images/research/right-arrow.svg";
const Round = "/images/research/round-icon.svg";
const Settings = "/images/research/settings.svg";
const Vault = "/images/research/vault.svg";

interface ResearchNavbarProps {
  activeSection: string;
  onChangeSection: (s: ResearchSection) => void;
  aoiExpanded: boolean;
  onToggleAoi: () => void;
  roundExpanded: boolean;
  onToggleRound: () => void;
  activeQuestion: string;
  activeRoundFolder: string;
  selected: string;
  onSelect: (panel: string) => void;
  selectedAOI?: string;
  selectedQuestionIdx?: number | null;
  submittedQuestions: Set<string>;
  questionsWithUnsavedEdits?: Set<string>;
  onAOISelect?: (aoi: string) => void;
  onQuestionSelect?: (idx: number) => void;
  roundUser: RoundUserExtended | null;
  joinedAOIs?: Set<ResearchAOI>;
  roundHidden?: boolean;
  roundUserCount?: number;
}

const Icon = {
  ChevronRight: (_props: React.SVGProps<SVGSVGElement>) => (
    <Image src={RightArrow} width={6} height={6} alt="RightArrow" />
  ),
};

const ResearchNavbar: React.FC<ResearchNavbarProps> = ({
  submittedQuestions,
  questionsWithUnsavedEdits = new Set(),
  selected,
  onSelect,
  selectedAOI,
  selectedQuestionIdx,
  onAOISelect,
  onQuestionSelect,
  roundUser,
  joinedAOIs = new Set(),
  roundHidden = false,
  roundUserCount = 0,
}) => {
  const [expandedRound, setExpandedRound] = useState<boolean>(false);
  const [AOIState, setAoiState] = useState<string>("");
  const [questionState, setQuestionState] = useState<number | null>(null);

  const effectiveAOI = selectedAOI ?? AOIState;
  const effectiveQuestionIdx =
    typeof selectedQuestionIdx === "number"
      ? selectedQuestionIdx
      : questionState;

  const isDisabled = !roundUser;
  const isLimitReached =
    roundUserCount >= DOMAIN_CAP && roundUser?.status === "pending";

  const items = [
    {
      key: "About",
      icon: <Image src={About} alt="About" width={40} height={40} />,
    },
    { key: "AOIs", icon: <Image src={Aoi} alt="Aoi" width={20} height={20} /> },
    {
      key: "Explore",
      icon: <Image src={Vault} alt="Explore" width={20} height={20} />,
    },
    {
      key: "Instructions",
      icon: (
        <Image src={Instructions} alt="Instructions" width={20} height={20} />
      ),
    },
  ];

  const roundAOIs = [
    "Common",
    "AI/ML",
    "Cybersecurity",
    "Blockchain",
    "Bioinformatics",
    "Quantum Computing",
    "IoT",
  ];

  // Map ResearchAOI to display labels
  const researchAOIToLabel: Record<ResearchAOI, string> = {
    aiml: "AI/ML",
    cybersecurity: "Cybersecurity",
    blockchain: "Blockchain",
    bioinformatics: "Bioinformatics",
    quantumcomputing: "Quantum Computing",
    iot: "IoT",
  };

  // Filter AOIs to only show joined ones + Common
  const visibleAOIs = roundAOIs.filter((aoi) => {
    if (aoi === "Common") {
      // Show Common only if at least one AOI is joined
      return joinedAOIs.size > 0;
    }
    // Check if this AOI is in the joined set
    const researchAOI = Object.entries(researchAOIToLabel).find(
      ([_, label]) => label === aoi,
    )?.[0] as ResearchAOI | undefined;
    return researchAOI && joinedAOIs.has(researchAOI);
  });

  // Map AOI names to varName prefixes
  const aoiToPrefixMap: Record<string, string> = {
    Common: "common",
    "AI/ML": "aiml",
    Cybersecurity: "cybersec",
    Blockchain: "blockchain",
    Bioinformatics: "bioinfo",
    "Quantum Computing": "quantum",
    IoT: "iot",
  };

  // Get number of questions per AOI dynamically
  const getQuestionsPerAOI = (aoi: string) => {
    const prefix = aoiToPrefixMap[aoi] || "common";
    const questions = roundUser?.round?.Question || [];
    const aoiQuestions = questions.filter(
      (q) =>
        (q.type === "stq" || q.type === "ltq") &&
        q.varName?.toLowerCase().startsWith(prefix),
    );
    return aoiQuestions.length;
  };

  return (
    <aside
      className="w-72 h-full bg-[#1A1A1A] text-white select-none relative overflow-hidden"
      aria-label="Research sidebar"
    >
      <div className="flex flex-col h-full p-2 overflow-auto pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="space-y-0 mb-10">
          <button
            type="button"
            aria-label="Go to Home"
            onClick={() => onSelect("Home")}
            className="p-2 mb-5 ml-1 cursor-pointer"
          >
            <Image src={ACM} width={175} height={175} alt="ACM" />
          </button>

          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => {
                if (!isDisabled && !isLimitReached) {
                  onSelect(it.key);
                }
              }}
              disabled={isDisabled || isLimitReached}
              className={`w-full my-1 flex items-center gap-3 pl-3 py-1.5 text-left transition-colors rounded font-monopoly ${
                isDisabled || isLimitReached
                  ? "cursor-not-allowed opacity-40"
                  : selected === it.key
                    ? "bg-[#7d5bed] cursor-pointer"
                    : "hover:bg-white/3 cursor-pointer"
              }`}
            >
              <span className="w-5 h-full text-white/90">{it.icon}</span>
              <span className="text-sm font-monopoly">{it.key}</span>
            </button>
          ))}

          {!roundHidden && (
            <button
              className={`w-full flex items-center justify-end pl-3 py-1.5 rounded transition-colors ${
                isDisabled || isLimitReached
                  ? "cursor-not-allowed opacity-40"
                  : selected === "Round 1"
                    ? "bg-[#7d5bed] cursor-pointer"
                    : "hover:bg-white/3 cursor-pointer"
              }`}
              onClick={(e) => {
                if (!isDisabled && !isLimitReached) {
                  setExpandedRound((s) => !s);
                  onSelect(expandedRound ? "" : "Round 1");
                }
                e.stopPropagation();
              }}
              disabled={isDisabled || isLimitReached}
              type="button"
              tabIndex={0}
            >
              <div className={`flex items-center gap-3 w-full`}>
                <div className="w-5 h-full relative">
                  <Image src={Round} alt="Round" width={20} height={20} />
                </div>
                <span className={`text-sm text-left font-monopoly`}>
                  Round 1
                </span>
              </div>
            </button>
          )}

          {!roundHidden && expandedRound && (
            <div className="space-y-1 pl-6">
              {visibleAOIs.length === 0 ? (
                <div className="text-white/60 text-sm px-2 py-2 font-monopoly">
                  No AOIs joined. Visit Explore to join AOIs.
                </div>
              ) : (
                visibleAOIs.map((aoi) => (
                  <div key={aoi} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-md hover:bg-white/3 transition-colors">
                      <button
                        type="button"
                        onClick={() => {
                          const next = aoi;
                          setAoiState(next);
                          setQuestionState(null);
                          onAOISelect?.(next);
                          onSelect("Round 1");
                        }}
                        className="flex items-center gap-3 text-left w-full cursor-pointer"
                      >
                        <span className="text-white/80">
                          <Icon.ChevronRight
                            className={`w-4 h-3.5 transform transition-transform`}
                          />
                        </span>
                        <span className="text-sm font-monopoly">{aoi}</span>
                      </button>

                      <div className="inline-flex items-center">
                        <div
                          className={`w-4 h-4 border-white border-1 rounded-[25%] ${
                            aoi === effectiveAOI ? "bg-[#C8B7FF]" : ""
                          }`}
                        ></div>
                      </div>
                    </div>

                    {effectiveAOI === aoi &&
                      roundUser?.status === "pending" && (
                        <div className="pl-6 space-y-1">
                          {Array.from(
                            { length: getQuestionsPerAOI(aoi) },
                            (_, qIdx) => {
                              let aoiname = "";
                              switch (aoi) {
                                case "Common":
                                  aoiname = "common";
                                  break;
                                case "AI/ML":
                                  aoiname = "aiml";
                                  break;
                                case "Cybersecurity":
                                  aoiname = "cybersec";
                                  break;
                                case "Quantum Computing":
                                  aoiname = "quantum";
                                  break;
                                case "Bioinformatics":
                                  aoiname = "bioinfo";
                                  break;
                                case "Blockchain":
                                  aoiname = "blockchain";
                                  break;
                                case "IoT":
                                  aoiname = "iot";
                                  break;
                              }
                              const questionKey = `${aoiname}-question${qIdx + 1}`;
                              const isSaved =
                                submittedQuestions.has(questionKey);
                              const hasUnsaved =
                                questionsWithUnsavedEdits.has(questionKey);

                              let borderClass =
                                "border-[#DBD3D3]/25 border-b-2";
                              if (hasUnsaved) {
                                borderClass = "border-orange-500 border-b-3";
                              } else if (isSaved) {
                                borderClass = "border-[#7D5BED] border-b-3";
                              }

                              return (
                                <button
                                  key={questionKey}
                                  type="button"
                                  onClick={() => {
                                    setQuestionState(qIdx);
                                    onQuestionSelect?.(qIdx);
                                    onSelect("Round 1");
                                  }}
                                  className={`w-full text-left px-3 py-0.5 ${borderClass} flex items-center justify-between text-sm transition-colors cursor-pointer rounded hover:bg-white/3 font-monopoly`}
                                >
                                  <span className="text-left font-monopoly">
                                    Question {qIdx + 1}
                                  </span>
                                  {effectiveQuestionIdx === qIdx && (
                                    <Icon.ChevronRight className="w-4 h-3.5 text-gray-500" />
                                  )}
                                </button>
                              );
                            },
                          )}
                        </div>
                      )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute top-0 right-0 h-full w-px bg-white" />
    </aside>
  );
};

export default ResearchNavbar;
