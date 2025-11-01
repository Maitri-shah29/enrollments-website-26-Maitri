"use client";
import Image from "next/image";
import React from "react";
import type { AOI, QuestionId } from "@/lib/types";
import AoiList from "./aoi-list";
import NavItem from "./nav-item";
import Round1List from "./round1-list";

type Props = {
  activeSection: "welcome" | "about" | "aoi" | "instructions" | "round1";
  onChangeSection: (s: Props["activeSection"]) => void;
  aoiExpanded: boolean;
  onToggleAoi: () => void;
  roundExpanded: boolean;
  onToggleRound: () => void;
  activeAOI: AOI;
  onSelectAOI: (aoi: AOI) => void;
  activeRoundFolder: AOI | "";
  activeQuestion: QuestionId | "";
  onSelectFolder: (folder: AOI) => void;
  onSelectQuestion: (q: QuestionId) => void;
  submittedQuestions: Set<string>;
  onLogoClick: () => void;
};

export default function Sidebar({
  activeSection,
  onChangeSection,
  aoiExpanded,
  onToggleAoi,
  roundExpanded,
  onToggleRound,
  activeAOI,
  onSelectAOI,
  activeRoundFolder,
  activeQuestion,
  onSelectFolder,
  onSelectQuestion,
  submittedQuestions,
  onLogoClick,
}: Props) {
  return (
    <div className="w-40 sm:w-[14%] overflow-hidden border-r-2 border-[#993C7A] h-full p-2 overflow-y-auto font-jetbrains [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#08111D] [&::-webkit-scrollbar-thumb]:bg-[#993C7A] [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-[#08111D] [&::-webkit-scrollbar-thumb:hover]:bg-[#b84a92]">
      <Image
        src="/images/acmlogo.svg"
        alt="acm logo"
        width={120}
        height={36}
        className="hover:cursor-pointer"
        onClick={onLogoClick}
      />

      <div className="w-full h-fit mt-5 font-jetbrains">
        {(
          [
            { name: "About", key: "about" },
            { name: "AOI", key: "aoi" },
            { name: "Instructions", key: "instructions" },
            { name: "Round 1", key: "round1" },
          ] as const
        ).map((item) => (
          <React.Fragment key={item.key}>
            <NavItem
              label={item.name}
              iconSrc="/images/folder.svg"
              isActive={activeSection === item.key}
              hasBottomBorder={item.key === "round1"}
              onClick={() => {
                if (item.key === "aoi") {
                  onToggleAoi();
                  onChangeSection("aoi");
                  return;
                }
                if (item.key === "round1") {
                  onToggleRound();
                  onChangeSection("round1");
                  return;
                }
                onChangeSection(item.key);
              }}
            />

            {item.key === "aoi" && activeSection === "aoi" && aoiExpanded && (
              <AoiList activeAOI={activeAOI} onSelectAOI={onSelectAOI} />
            )}

            {item.key === "round1" &&
              activeSection === "round1" &&
              roundExpanded && (
                <Round1List
                  activeRoundFolder={activeRoundFolder}
                  activeQuestion={activeQuestion}
                  onSelectFolder={onSelectFolder}
                  onSelectQuestion={onSelectQuestion}
                  submittedQuestions={submittedQuestions}
                />
              )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
