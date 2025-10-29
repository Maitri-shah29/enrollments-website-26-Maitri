"use client";
import React, { useState } from "react";
import { aoiList, questionsList, round1Folders } from "@/lib/constants";
import { questionsData } from "@/lib/questions-data";
import { useTechNavigation } from "@/lib/tech-navigation";
import type { AOI, QuestionId } from "@/lib/types";
import About from "./components/tech/about";
import AOIContent from "./components/tech/aoi";
import TechButton from "./components/tech/button";
import Instructions from "./components/tech/instructions";
import TechLanding from "./components/tech/landing";
import Questions from "./components/tech/questions";
import Sidebar from "./components/tech/sidebar";

// The unused suppression comment has been removed
const TechWebsite = () => {
  const {
    activeSection,
    aoiExpanded,
    roundExpanded,
    activeAOI,
    activeRoundFolder,
    activeQuestion,
    setSection,
    toggleAoi,
    toggleRound,
    selectAoi,
    selectFolder,
    selectQuestion,
  } = useTechNavigation();
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // constants and questionsData are imported from components/tech

  const renderContent = () => {
    if (activeSection === "about") {
      return <About />;
    }

    if (activeSection === "aoi") {
      if (activeAOI) {
        return <AOIContent activeAOI={activeAOI} />;
      }

      return (
        <div className="text-[#993C7A] text-2xl font-semibold">
          <h1>Areas of Interest</h1>
          <p className="mt-4 text-lg text-white">
            Select a subtopic from the sidebar to view more details.
          </p>
        </div>
      );
    }

    if (activeSection === "instructions") {
      return <Instructions />;
    }

    if (activeSection === "round1") {
      return (
        <Questions
          activeRoundFolder={activeRoundFolder}
          activeQuestion={activeQuestion}
          questionsData={questionsData}
          answers={answers}
          submittedQuestions={submittedQuestions}
          onChangeAnswer={(key, value) =>
            setAnswers((prev) => ({ ...prev, [key]: value }))
          }
          onSubmit={(key) =>
            setSubmittedQuestions((prev) => new Set([...prev, key]))
          }
        />
      );
    }

    if (activeSection === "welcome") {
      return <TechLanding onGetStarted={() => setSection("about")} />;
    }
  };

  return (
    <div className="w-full h-full bg-[#08111D] flex font-jetbrains [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-[#08111D] [&::-webkit-scrollbar-thumb]:bg-[#993C7A] [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-[#08111D] [&::-webkit-scrollbar-thumb:hover]:bg-[#b84a92]">
      <Sidebar
        activeSection={activeSection}
        onChangeSection={setSection}
        aoiExpanded={aoiExpanded}
        onToggleAoi={toggleAoi}
        roundExpanded={roundExpanded}
        onToggleRound={toggleRound}
        activeAOI={activeAOI}
        onSelectAOI={selectAoi}
        activeRoundFolder={activeRoundFolder}
        activeQuestion={activeQuestion}
        onSelectFolder={selectFolder}
        onSelectQuestion={selectQuestion}
        submittedQuestions={submittedQuestions}
        onLogoClick={() => setSection("welcome")}
      />

      <div className="w-full h-full p-7 relative font-jetbrains">
        <div className="w-full h-full border-2 border-[#993C7A] flex flex-col justify-center items-center p-10 relative overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default TechWebsite;
