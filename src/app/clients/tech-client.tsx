"use client";
import { useEffect, useState } from "react";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import { useTechNavigation } from "@/lib/tech-navigation";
import type { AOI } from "@/lib/types";
import About from "./components/tech/about";
import AOIContent from "./components/tech/aoi";
import ExploreAOIs from "./components/tech/explore";
import Instructions from "./components/tech/instructions";
import TechLanding from "./components/tech/landing";
import Questions from "./components/tech/questions";
import Sidebar from "./components/tech/sidebar";
import createRoundUser from "../actions/create-round-user";
import { Domain } from "@prisma/client";

const AOI_JOIN_LIMIT = 3;

type TechClientProps = {
  initialRoundUser?: RoundUserExtended | null;
};

const TechWebsite = ({ initialRoundUser }: TechClientProps) => {
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
  const [roundUser, setRoundUser] = useState<RoundUserExtended | null>(
    initialRoundUser ?? null,
  );
  const [joinedAOIs, setJoinedAOIs] = useState<Set<AOI>>(new Set());
  const [aoisLoaded, setAoisLoaded] = useState(false);
  const roundHidden = !!roundUser?.round?.hidden;

  useEffect(() => {
    const savedAOIs = localStorage.getItem("tech-joined-aois");
    if (savedAOIs) {
      try {
        const parsed = JSON.parse(savedAOIs) as AOI[];
        console.log("Restored AOIs from localStorage:", parsed);
        setJoinedAOIs(new Set(parsed));
      } catch (err) {
        console.error("Failed to parse saved AOIs:", err);
      }
    }
    setAoisLoaded(true);
  }, []);

  useEffect(() => {
    if (!aoisLoaded) return;
    const aoiArray = [...joinedAOIs];
    console.log("Saving AOIs to localStorage:", aoiArray);
    localStorage.setItem("tech-joined-aois", JSON.stringify(aoiArray));
  }, [joinedAOIs, aoisLoaded]);

  useEffect(() => {
    if (roundUser?.formSubmission?.responses) {
      const savedAnswers: Record<string, string> = {};
      const questions = roundUser.round?.Question || [];

      console.log(
        "Loading responses from DB:",
        roundUser.formSubmission.responses.length,
      );

      for (const response of roundUser.formSubmission.responses) {
        if (response.response) {
          const question = questions.find((q) => q.id === response.questionId);
          if (question) {
            const folderQuestions = questions
              .filter((q) => q.varName === question.varName)
              .sort((a, b) => a.serial - b.serial);
            const questionIndex = folderQuestions.findIndex(
              (q) => q.id === question.id,
            );
            if (questionIndex !== -1) {
              const questionKey = `${question.varName}-question${questionIndex + 1}`;
              savedAnswers[questionKey] = response.response;
              console.log(
                `Restored answer for ${questionKey}:`,
                response.response.substring(0, 50),
              );
            }
          }
        }
      }
      console.log("Total restored answers:", Object.keys(savedAnswers).length);
      setAnswers(savedAnswers);
    }
  }, [roundUser]);

  const handleJoinAOI = (aoi: AOI) => {
    if (joinedAOIs.size < AOI_JOIN_LIMIT) {
      setJoinedAOIs((prev) => new Set([...prev, aoi]));
    }
  };
  const handleLeaveAOI = (aoi: AOI) => {
    setJoinedAOIs((prev) => {
      const newSet = new Set(prev);
      newSet.delete(aoi);
      return newSet;
    });
  };

  const initializeRoundUser = async () => {
    try {
      const result = await createRoundUser(Domain.tech);
      console.log(result);

      setRoundUser(result.roundUser as RoundUserExtended);
      setSection("about");
    } catch (err) {
      console.error("Error initializing round user:", err);
    }
  };

  const renderContent = () => {
    const roundUserStatus = roundUser?.status || "pending";

    // Status-based rendering for evaluate, promoted, rejected
    if (roundUserStatus === "evaluate") {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-[#993C7A] text-3xl font-jetbrains mb-4">
              Your responses are being evaluated
            </h2>
            <p className="text-white text-lg">
              Please wait while we review your submission.
            </p>
          </div>
        </div>
      );
    }

    if (roundUserStatus === "promoted") {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-[#993C7A] text-3xl font-jetbrains mb-4">
              Congratulations! 🎉
            </h2>
            <p className="text-white text-lg">
              You are promoted to the next round
            </p>
          </div>
        </div>
      );
    }

    if (roundUserStatus === "rejected") {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-red-500 text-3xl font-jetbrains mb-4">
              Unfortunately, you could not pass this round
            </h2>
            <p className="text-white text-lg">
              Thank you for participating. Better luck next time!
            </p>
          </div>
        </div>
      );
    }

    if (activeSection === "about") return <About />;
    if (activeSection === "aoi") {
      if (activeAOI) return <AOIContent activeAOI={activeAOI} />;
      return (
        <div className="text-[#993C7A] text-2xl font-semibold">
          <h1>Areas of Interest</h1>
          <p className="mt-4 text-lg text-white">
            Select a subtopic from the sidebar to view more details.
          </p>
        </div>
      );
    }
    if (activeSection === "instructions") return <Instructions />;
    if (activeSection === "explore")
      return (
        <div className="w-full">
          <div className="mb-6">
            <div className="text-[#993C7A] text-xl font-bold mb-2">
              Explore & Join AOIs
            </div>
            <div className="text-white text-base">
              Select up to{" "}
              <span className="text-[#b84a92] font-semibold">
                {AOI_JOIN_LIMIT}
              </span>{" "}
              areas of interest you'd like to participate in. Joining an AOI
              unlocks those questions in Round 1.
              <br />
              You can leave an AOI to join another.
            </div>
          </div>
          <ExploreAOIs
            joinedAOIs={joinedAOIs}
            onJoinAOI={handleJoinAOI}
            onLeaveAOI={handleLeaveAOI}
          />
        </div>
      );
    if (activeSection === "round1") {
      if (roundHidden) {
        return (
          <div className="text-center text-[#993C7A] text-xl py-12">
            <h1 className="text-2xl font-bold mb-4">Round Hidden</h1>
            <p className="text-white">
              This round is currently hidden and cannot be accessed.
            </p>
          </div>
        );
      }
      return (
        <Questions
          activeRoundFolder={activeRoundFolder}
          activeQuestion={activeQuestion}
          roundUser={roundUser ?? undefined}
          answers={answers}
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
      return <TechLanding onGetStarted={initializeRoundUser} />;
    }
    return null;
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
        roundUser={roundUser}
        joinedAOIs={joinedAOIs}
        currentAnswers={answers}
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
