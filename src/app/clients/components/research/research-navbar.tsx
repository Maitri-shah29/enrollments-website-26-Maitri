"use client";

import Image from "next/image";
import type React from "react";
import { useState } from "react";
import About from "../../../../../public/images/research/about.svg";
import ACM from "../../../../../public/images/research/acm-logo.svg";
import Aoi from "../../../../../public/images/research/aoi.svg";
import Help from "../../../../../public/images/research/help.svg";
import Instructions from "../../../../../public/images/research/instructions.svg";
import Interview from "../../../../../public/images/research/interview.svg";
import RightArrow from "../../../../../public/images/research/right-arrow.svg";
import Round from "../../../../../public/images/research/round-icon.svg";
import Settings from "../../../../../public/images/research/settings.svg";
import Vault from "../../../../../public/images/research/vault.svg";

interface ResearchNavbarProps {
  selected: string;
  onSelect: (panel: string) => void;
}
//test
const Icon = {
  ChevronRight: (_props: React.SVGProps<SVGSVGElement>) => (
    <Image src={RightArrow} width={9} height={16} alt="RightArrow" />
  ),
};

const questions = [
  "This is question 1",
  "This is question 2",
  "This is question 3",
  "This is question 4",
  "This is question 5",
  "This is question 6",
  "This is question 7",
  "This is question 8",
  "This is question 9",
  "This is question 10",
];

const ResearchNavbar: React.FC<ResearchNavbarProps> = ({
  selected,
  onSelect,
}) => {
  const [expandedRound, setExpandedRound] = useState<boolean>(false);
  const [AOI, setAoi] = useState<string>(""); // current expanded AOI
  const [question, setQuestion] = useState<number | null>(null); // selected question index

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
    "Blockchain",
    "Quantum Computing",
    "AIML",
    "BioInformatics",
    "Cyber Security",
    "IoT",
  ];

  return (
    <aside
      className="w-72 h-full bg-[#1A1A1A] text-white select-none relative overflow-y-auto border-r-1 border-white"
      aria-label="Research sidebar"
    >
      <div className="px-0 pt-6 pb-3">
        <div className="space-y-0">
          <div className="p-2 mb-5 ml-1 transition-transform">
            <Image src={ACM} width={175} height={175} alt="ACM" />
          </div>
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => {
                onSelect(it.key);
              }}
              className={`w-full flex items-center gap-3 pl-3 py-0.5 text-left transition-colors cursor-pointer ${selected !== it.key ? "hover:bg-white/3" : ""}`}
            >
              <span className="w-5 h-full text-white/90">{it.icon}</span>
              <div
                className={`w-full flex items-center py-1 pl-1 text-left transition-colors cursor-pointer ${
                  selected === it.key ? "bg-[#7d5bed]" : ""
                }`}
              >
                <span className="text-sm">{it.key}</span>
              </div>
            </button>
          ))}

          <button
            className={`mt-1 w-full flex items-center justify-end pl-3  py-0.5 rounded-sm cursor-pointer transition-colors ${selected === "Round 1" ? "" : "hover:bg-white/3"}`}
            onClick={(e) => {
              setExpandedRound((s) => !s);
              onSelect(expandedRound ? "" : "Round 1");
              e.stopPropagation();
            }}
            type="button"
            tabIndex={0}
          >
            <div className={`flex items-center gap-3 w-full`}>
              <div className="w-5 h-full relative">
                <Image src={Round} alt="Round" width={20} height={20} />
              </div>
              <div
                className={`flex w-full h-full pl-1 py-1 ${selected === "Round 1" ? "bg-[#7D5BED] text-white" : ""}`}
              >
                <span className={`text-sm text-left`}>Round 1</span>
              </div>
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
                        setAoi((prev) => (prev === aoi ? "" : aoi));
                        setQuestion(null);
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
                        className={`w-4 h-4 border-white border-1 rounded-[25%] ${aoi === AOI ? "bg-[#C8B7FF]" : ""}`}
                      ></div>
                    </div>
                  </div>

                  {AOI === aoi && (
                    <div className="pl-6 space-y-1">
                      {questions.map((qText, qIdx) => (
                        <button
                          key={`${AOI}-${qText}`}
                          type="button"
                          onClick={() => {
                            setQuestion(qIdx);
                            onSelect("Round 1");
                          }}
                          className={`w-full text-left px-3 py-0.5 border-b-2 border-[#DBD3D37D] flex items-center justify-between text-sm transition-colors cursor-pointer`}
                        >
                          <span className="text-left">{qText}</span>
                          {question === qIdx && (
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
                onSelect("Interview");
              }}
              className={`w-full flex items-center gap-3 pl-3 py-1 text-left transition-colors cursor-pointer ${selected !== "Interview" ? "hover:bg-white/3" : ""}`}
            >
              <span className="w-5 h-full text-white/90">
                <Image src={Interview} alt="interview" className="w-5 h-5" />
              </span>
              <div
                className={`w-full flex items-center py-1 pl-1 text-left transition-colors cursor-pointer ${
                  selected === "Interview" ? "bg-[#7d5bed]" : ""
                }`}
              >
                <span className="text-sm">Interview</span>
              </div>
            </button>
          </div>
        </div>
        <div className="flex flex-col items-start mt-4 pb-4">
          <button
            className="p-2 hover:scale-105 transition-transform"
            type="button"
          >
            <Image src={Vault} alt="vault" className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:scale-105 transition-transform"
            type="button"
          >
            <Image src={Help} alt="help" className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:scale-105 transition-transform"
            type="button"
          >
            <Image src={Settings} alt="settings" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ResearchNavbar;
