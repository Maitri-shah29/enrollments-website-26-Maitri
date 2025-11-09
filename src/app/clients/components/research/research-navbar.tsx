//research-navbar
"use client";

import Image from "next/image";
import type React from "react";
import { useState } from "react";
import type { RoundUserExtended } from "@/app/clients/components/research/questions";

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
  selected: string;
  onSelect: (panel: string) => void;
  selectedAOI?: string;
  selectedQuestionIdx?: number | null;
  onAOISelect?: (aoi: string) => void;
  onQuestionSelect?: (idx: number) => void;
  roundUser?: RoundUserExtended | null;
}
//test
const Icon = {
  ChevronRight: (_props: React.SVGProps<SVGSVGElement>) => (
    <Image src={RightArrow} width={9} height={16} alt="RightArrow" />
  ),
};

const ResearchNavbar: React.FC<ResearchNavbarProps> = ({
  selected,
  onSelect,
  selectedAOI,
  selectedQuestionIdx,
  onAOISelect,
  onQuestionSelect,
  roundUser,
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

  const items = [
    {
      key: "About",
      icon: <Image src={About} alt="About" width={40} height={40} />,
    },
    { key: "AOIs", icon: <Image src={Aoi} alt="Aoi" width={20} height={20} /> },
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

  // 4 questions per AOI
  const questionsPerAOI = 4;

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
                if (!isDisabled) {
                  onSelect(it.key);
                }
              }}
              disabled={isDisabled}
              className={`w-full flex items-center gap-3 pl-3 py-2 text-left transition-colors rounded ${
                isDisabled
                  ? "cursor-not-allowed opacity-40"
                  : selected === it.key
                    ? "bg-[#7d5bed] cursor-pointer"
                    : "hover:bg-white/3 cursor-pointer"
              }`}
            >
              <span className="w-5 h-full text-white/90">{it.icon}</span>
              <span className="text-sm">{it.key}</span>
            </button>
          ))}

          <button
            className={`mt-1 w-full flex items-center justify-end pl-3 py-2 rounded transition-colors ${
              isDisabled
                ? "cursor-not-allowed opacity-40"
                : selected === "Round 1"
                  ? "bg-[#7d5bed] cursor-pointer"
                  : "hover:bg-white/3 cursor-pointer"
            }`}
            onClick={(e) => {
              if (!isDisabled) {
                setExpandedRound((s) => !s);
                onSelect(expandedRound ? "" : "Round 1");
              }
              e.stopPropagation();
            }}
            disabled={isDisabled}
            type="button"
            tabIndex={0}
          >
            <div className={`flex items-center gap-3 w-full`}>
              <div className="w-5 h-full relative">
                <Image src={Round} alt="Round" width={20} height={20} />
              </div>
              <span className={`text-sm text-left`}>Round 1</span>
            </div>
          </button>

          {expandedRound && (
            <div className="space-y-1 pl-6">
              {roundAOIs.map((aoi) => (
                <div key={aoi} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 px-2 py-0.5 rounded-md hover:bg-white/3 transition-colors">
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
                      <span className="text-sm">{aoi}</span>
                    </button>

                    <div className="inline-flex items-center">
                      <div
                        className={`w-4 h-4 border-white border-1 rounded-[25%] ${
                          aoi === effectiveAOI ? "bg-[#C8B7FF]" : ""
                        }`}
                      ></div>
                    </div>
                  </div>

                  {effectiveAOI === aoi && (
                    <div className="pl-6 space-y-1">
                      {Array.from({ length: questionsPerAOI }, (_, qIdx) => (
                        <button
                          key={`${aoi}-q${qIdx + 1}`}
                          type="button"
                          onClick={() => {
                            setQuestionState(qIdx);
                            onQuestionSelect?.(qIdx);
                            onSelect("Round 1");
                          }}
                          className={`w-full text-left px-3 py-0.5 border-b-2 border-[#DBD3D3]/50 flex items-center justify-between text-sm transition-colors cursor-pointer`}
                        >
                          <span className="text-left">Question {qIdx + 1}</span>
                          {effectiveQuestionIdx === qIdx && (
                            <Icon.ChevronRight className="w-4 h-3.5 text-gray-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-0">
            <button
              type="button"
              onClick={() => {
                if (!isDisabled) {
                  onSelect("Interview");
                }
              }}
              disabled={isDisabled}
              className={`w-full flex items-center gap-3 pl-3 py-2 text-left transition-colors rounded ${
                isDisabled
                  ? "cursor-not-allowed opacity-40"
                  : selected === "Interview"
                    ? "bg-[#7d5bed] cursor-pointer"
                    : "hover:bg-white/3 cursor-pointer"
              }`}
            >
              <span className="w-5 h-full text-white/90">
                <Image
                  src={Interview}
                  alt="interview"
                  width={40}
                  height={40}
                  className="w-5 h-5"
                />
              </span>
              <span className="text-sm">Interview</span>
            </button>
          </div>
        </div>
        <div
          className="flex flex-col items-start mt-auto"
          style={{ marginBottom: "-0px" }}
        >
          <button
            className="p-2 hover:scale-105 transition-transform"
            type="button"
          >
            <Image
              src={Vault}
              alt="vault"
              width={40}
              height={40}
              className="w-5 h-5"
            />
          </button>
          <button
            className="p-2 hover:scale-105 transition-transform"
            type="button"
          >
            <Image
              src={Help}
              alt="help"
              width={40}
              height={40}
              className="w-5 h-5"
            />
          </button>
          <button
            className="p-2 hover:scale-105 transition-transform"
            type="button"
          >
            <Image
              src={Settings}
              alt="settings"
              width={40}
              height={40}
              className="w-5 h-5"
            />
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute top-0 right-0 h-full w-px bg-white" />
    </aside>
  );
};

export default ResearchNavbar;
