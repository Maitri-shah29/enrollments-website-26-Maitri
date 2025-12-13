"use client";
import { useEffect, useRef, useState } from "react";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import { DOMAIN_CAP } from "@/lib/constants";
import { useTechNavigation } from "@/lib/tech-navigation";
import type { AOI, QuestionId } from "@/lib/types";
import createRoundUser from "../actions/create-round-user";
import About from "./components/tech/about";
import AOIContent from "./components/tech/aoi";
import ExploreAOIs from "./components/tech/explore";
import Instructions from "./components/tech/instructions";
import TechLanding from "./components/tech/landing";
import Questions, { type QuestionsRef } from "./components/tech/questions";
import Sidebar from "./components/tech/sidebar";

const AOI_JOIN_LIMIT = 3;

type TechClientProps = {
  initialRoundUser?: RoundUserExtended | null;
  roundUserCount: number;
};

const TechWebsite = ({ initialRoundUser, roundUserCount }: TechClientProps) => {
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
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [roundUser, setRoundUser] = useState<RoundUserExtended | null>(
    initialRoundUser ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [joinedAOIs, setJoinedAOIs] = useState<Set<AOI>>(new Set());
  const [aoisLoaded, setAoisLoaded] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: "folder" | "question";
    value: string;
  } | null>(null);
  const hasUnsavedChangesRef = useRef<boolean>(false);
  const [isProceeding, setIsProceeding] = useState<boolean>(false);
  const childRef = useRef<QuestionsRef>(null);
  const roundActive = !!roundUser?.round?.active;
  const isAnnounced = !!roundUser?.round?.announced;
  const roundHidden = !!roundUser?.round?.hidden;

  useEffect(() => {
    const savedAOIs = localStorage.getItem("tech-joined-aois");
    if (savedAOIs) {
      try {
        const parsed = JSON.parse(savedAOIs) as AOI[];
        // console.log("Restored AOIs from localStorage:", parsed);
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
    // console.log("Saving AOIs to localStorage:", aoiArray);
    localStorage.setItem("tech-joined-aois", JSON.stringify(aoiArray));
  }, [joinedAOIs, aoisLoaded]);

  useEffect(() => {
    if (roundUser?.formSubmission?.responses) {
      const loadedAnswers: Record<string, string> = {};
      const loadedSavedAnswers: Record<string, string> = {};
      const loadedSubmittedQuestions = new Set<string>();
      const questions = roundUser.round?.Question || [];

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
              const questionKey = `${question.varName}-question${
                questionIndex + 1
              }`;
              loadedAnswers[questionKey] = response.response;
              loadedSavedAnswers[question.id] = response.response;
              loadedSubmittedQuestions.add(questionKey);
            }
          }
        }
      }
      setAnswers(loadedAnswers);
      setSavedAnswers(loadedSavedAnswers);
      setSubmittedQuestions(loadedSubmittedQuestions);
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
    setLoading(true);
    setError(null);
    if (roundUserCount >= DOMAIN_CAP) {
      setError(
        `You have already enrolled in ${roundUserCount} domains. Maximum is ${DOMAIN_CAP}.`,
      );
      setLoading(false);
      return;
    }
    try {
      const result = await createRoundUser("tech");
      console.log(result);

      if ("error" in result) {
        if (result.error === "Round is not active") {
          setError("Enrollments for this domain haven't started yet");
        } else if (result.error === "No form round found for this domain") {
          setError("This domain is not available for enrollment at the moment");
        } else if (result.error === "Internal server error") {
          setError("Something went wrong. Please try again later");
        } else {
          setError(result.error ?? "Unknown error");
        }
        return;
      }

      setRoundUser(result.roundUser as RoundUserExtended);
      setSection("about");
    } catch (err) {
      console.error("Error initializing round user:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initialize round user",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    const roundUserStatus = roundUser?.status || "pending";

    // Allow about, instructions, and aoi pages to be displayed normally
    if (activeSection === "about") return <About />;
    if (activeSection === "instructions") return <Instructions />;
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
    // Status-based rendering for evaluate, promoted, rejected
    if (
      roundUserStatus === "evaluate" ||
      (!isAnnounced && activeSection === "round1")
    ) {
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

    if (
      roundUserStatus === "promoted" &&
      isAnnounced &&
      activeSection === "round1"
    ) {
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

    if (
      roundUserStatus === "rejected" &&
      isAnnounced &&
      activeSection === "round1"
    ) {
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
      if (joinedAOIs.size === 0) {
        return (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="text-[#993C7A] text-3xl font-jetbrains mb-4">
                No AOIs Selected
              </div>
              <p className="text-white text-lg mb-4">
                You must select at least one Area of Interest before accessing
                Round 1 questions.
              </p>
              <button
                type="button"
                onClick={() => setSection("explore")}
                className="px-6 py-2 bg-[#993C7A] text-white font-jetbrains hover:bg-[#b84a92] transition-colors rounded"
              >
                Go to Explore AOIs
              </button>
            </div>
          </div>
        );
      }

      if (!roundActive) {
        return (
          <div className="text-center text-[#993C7A] text-xl py-12">
            <h1 className="text-2xl font-bold mb-4">
              Round currently inactive.
            </h1>
            <p className="text-white">This round will start soon...</p>
          </div>
        );
      }
      return (
        <Questions
          ref={childRef}
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
          savedAnswers={savedAnswers}
          onSaveAnswer={(questionId, value) =>
            setSavedAnswers((prev) => ({ ...prev, [questionId]: value }))
          }
          hasUnsavedChangesRef={hasUnsavedChangesRef}
          onMarkUnsaved={(key) =>
            setSubmittedQuestions((prev) => {
              const newSet = new Set(prev);
              newSet.delete(key);
              return newSet;
            })
          }
        />
      );
    }
    if (activeSection === "welcome") {
      return (
        <TechLanding
          onGetStarted={initializeRoundUser}
          loading={loading}
          hasRoundUser={!!roundUser}
          onContinue={() => setSection("about")}
        />
      );
    }
    return null;
  };

  const handleFolderSelectWithCheck = (folder: string) => {
    if (hasUnsavedChangesRef.current) {
      setPendingNavigation({ type: "folder", value: folder });
      setShowUnsavedDialog(true);
      return;
    }
    selectFolder(folder as AOI);
  };

  const handleQuestionSelectWithCheck = (question: string) => {
    if (hasUnsavedChangesRef.current) {
      setPendingNavigation({ type: "question", value: question });
      setShowUnsavedDialog(true);
      return;
    }
    selectQuestion(question as QuestionId);
  };

  const handleConfirmNavigation = () => {
    if (childRef.current?.trigger) {
      setIsProceeding(true);
      childRef.current.trigger().then(() => {
        if (pendingNavigation) {
          if (pendingNavigation.type === "folder") {
            selectFolder(pendingNavigation.value as AOI);
          } else {
            selectQuestion(pendingNavigation.value as QuestionId);
          }
        }
        hasUnsavedChangesRef.current = false;
        setShowUnsavedDialog(false);
        setPendingNavigation(null);
        setIsProceeding(false);
      });
    } else {
      if (pendingNavigation) {
        if (pendingNavigation.type === "folder") {
          selectFolder(pendingNavigation.value as AOI);
        } else {
          selectQuestion(pendingNavigation.value as QuestionId);
        }
      }
      hasUnsavedChangesRef.current = false;
      setShowUnsavedDialog(false);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  return (
    <div className="w-full h-full bg-[#08111D] flex font-jetbrains [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-[#08111D] [&::-webkit-scrollbar-thumb]:bg-[#993C7A] [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-[#08111D] [&::-webkit-scrollbar-thumb:hover]:bg-[#b84a92]">
      {showUnsavedDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#08111D] border-2 border-[#993C7A] rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-[#993C7A] text-2xl font-jetbrains mb-4">
              Unsaved Changes
            </h3>
            <p className="text-white text-lg mb-6">
              You have unsaved changes. Do you want to proceed without saving?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelNavigation}
                className="px-6 py-2 bg-transparent border-2 border-white text-white font-jetbrains hover:bg-white hover:text-black transition-colors"
                type="button"
                disabled={isProceeding}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNavigation}
                className="px-6 py-2 bg-[#993C7A] text-white font-jetbrains hover:bg-[#b84a92] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                disabled={isProceeding}
              >
                {isProceeding ? "Saving..." : "Proceed & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Error Popup */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#08111D] border-2 border-[#993C7A] rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-[#993C7A] text-2xl font-jetbrains mb-4">
              Oops!
            </h3>
            <p className="text-white text-lg mb-6">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="w-full px-6 py-2 bg-[#993C7A] text-white font-jetbrains hover:bg-[#b84a92] transition-colors rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
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
        onSelectFolder={handleFolderSelectWithCheck}
        onSelectQuestion={handleQuestionSelectWithCheck}
        submittedQuestions={submittedQuestions}
        onLogoClick={() => setSection("welcome")}
        roundUser={roundUser}
        joinedAOIs={joinedAOIs}
        currentAnswers={answers}
        savedAnswers={savedAnswers}
        roundActive={roundActive}
        roundHidden={roundHidden}
        roundUserCount={roundUserCount}
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
