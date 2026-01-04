"use client";
import type { Question, Response } from "@prisma/client";
import { s } from "framer-motion/client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import { DOMAIN_CAP } from "@/lib/constants";
import type { DesignAOI } from "@/lib/types";
import createRoundUser from "../actions/create-round-user";
import About from "./components/design/about";
import AOIs from "./components/design/aoi";
import DesignNavbar from "./components/design/design-navbar";
import Home from "./components/design/home";
import Instructions from "./components/design/instructions";
import Interview from "./components/design/interview";
import Questions from "./components/design/questions";

const AOI_JOIN_LIMIT = 2;

interface DesignClientProps {
  initialRoundUser?: RoundUserExtended | null;
  roundUserCount: number;
}
interface TransformedQuestion {
  header: string;
  content: string;
  questionId: string; // Added to track question ID for responses
}
interface AOIData {
  name: string;
  questions: TransformedQuestion[];
}

const groupQuestionsByVarName = (questions: Question[]): AOIData[] => {
  const grouped = questions.reduce(
    (acc, question) => {
      const varName = question.varName;
      if (!acc[varName]) {
        acc[varName] = [];
      }
      acc[varName].push(question);
      return acc;
    },
    {} as Record<string, Question[]>,
  );

  return Object.entries(grouped).map(([varName, questions]) => ({
    name: varName,
    questions: questions
      .sort((a, b) => a.serial - b.serial)
      .map((q) => ({
        header: `Question ${q.serial}`,
        content: q.question,
        questionId: q.id, // Include question ID
      })),
  }));
};

const DesignClient = ({
  initialRoundUser,
  roundUserCount,
}: DesignClientProps) => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");
  const [roundUser, setRoundUser] = useState<RoundUserExtended | null>(
    initialRoundUser ?? null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedAOIs, setJoinedAOIs] = useState<Set<DesignAOI>>(new Set());
  const [aoisLoaded, setAoisLoaded] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [questionsWithUnsavedEdits, setQuestionsWithUnsavedEdits] = useState<
    Set<string>
  >(new Set());
  const roundHidden = !!roundUser?.round?.hidden;

  const designAOIToVarName: Record<DesignAOI, string> = {
    uiux: "uiux",
    videoediting: "videoediting",
    illustrations: "illustrations",
    motiongraphics: "motiongraphics",
    "3d": "3d",
  };

  const [selectedQuestion, setSelectedQuestion] =
    useState<TransformedQuestion | null>(null);

  const formQuestions = roundUser?.round?.Question || [];
  const filteredQuestions = useMemo(() => {
    if (joinedAOIs.size === 0) {
      return [];
    }

    const allowedVarNames = new Set<string>();
    // Always include common questions if any AOI is joined
    allowedVarNames.add("common");

    for (const aoi of joinedAOIs) {
      allowedVarNames.add(designAOIToVarName[aoi]);
    }

    return formQuestions.filter((q) =>
      Array.from(allowedVarNames).some((varName) =>
        q.varName?.toLowerCase().includes(varName.toLowerCase()),
      ),
    );
  }, [formQuestions, joinedAOIs]);

  const aoiData = useMemo(
    () => groupQuestionsByVarName(filteredQuestions),
    [filteredQuestions],
  );

  useEffect(() => {
    const savedAOIs = localStorage.getItem("design-joined-aois");
    if (savedAOIs) {
      try {
        const parsed = JSON.parse(savedAOIs) as DesignAOI[];
        console.log("Restored Design AOIs from localStorage:", parsed);
        setJoinedAOIs(new Set(parsed));
      } catch (err) {
        console.error("Failed to parse saved Design AOIs:", err);
      }
    }
    setAoisLoaded(true);
  }, []);

  useEffect(() => {
    setSelectedAoi(aoiData[0] || null);
    setSelectedQuestion(aoiData[0]?.questions[0] || null);
  }, [aoiData]);

  useEffect(() => {
    if (!aoisLoaded) return;
    const aoiArray = [...joinedAOIs];
    console.log("Saving Design AOIs to localStorage:", aoiArray);
    localStorage.setItem("design-joined-aois", JSON.stringify(aoiArray));
  }, [joinedAOIs, aoisLoaded]);

  const handleJoinAOI = (aoi: DesignAOI) => {
    if (joinedAOIs.size < AOI_JOIN_LIMIT) {
      setJoinedAOIs((prev) => new Set([...prev, aoi]));
    }
  };

  const handleLeaveAOI = (aoi: DesignAOI) => {
    setJoinedAOIs((prev) => {
      const newSet = new Set(prev);
      newSet.delete(aoi);
      return newSet;
    });
  };

  const continueCheck = () => {
    if (roundUserCount >= DOMAIN_CAP) {
      setError(
        `You have already enrolled in ${roundUserCount} domains. Maximum is ${DOMAIN_CAP}.`,
      );
      setLoading(false);
      return;
    }
    setSelectedPanel("About");
  };
  const initializeRoundUser = async () => {
    setLoading(true);
    setError(null);
    // console.log(await createRoundUser(Domain.cc));
    if (roundUserCount >= DOMAIN_CAP) {
      setError(
        `You have already enrolled in ${roundUserCount} domains. Maximum is ${DOMAIN_CAP}.`,
      );
      setLoading(false);
      return;
    }
    try {
      const result = await createRoundUser("design");
      console.log(result);

      if ("error" in result) {
        if (result.error === "Round is not active") {
          setError("Selections for this domain haven't started yet");
        } else if (result.error === "No form round found for this domain") {
          setError("This domain is not available for selection at the moment");
        } else if (result.error === "Internal server error") {
          setError("Something went wrong. Please try again later");
        } else {
          setError(result.error ?? "Unknown error");
        }
        return;
      }

      setRoundUser(result.roundUser as RoundUserExtended);
      setSelectedPanel("About");
    } catch (err) {
      console.error("Error initializing round user:", err);

      setError(
        err instanceof Error ? err.message : "Failed to initialize round user",
      );
    } finally {
      setLoading(false);
    }
  };
  // get questions from the round

  const [selectedAoi, setSelectedAoi] = useState<AOIData | null>(
    aoiData[0] || null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProceeding, setIsProceeding] = useState<boolean>(false);

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const [savedResponses, setSavedResponses] = useState<Response[]>(
    (roundUser?.formSubmission?.responses as Response[]) || [],
  );

  useEffect(() => {
    if (savedResponses.length > 0) {
      const loadedAnswers: Record<string, string> = {};
      for (const response of savedResponses) {
        if (response.response) {
          loadedAnswers[response.questionId] = response.response;
        }
      }
      setAnswers(loadedAnswers);
      setSavedAnswers(loadedAnswers);

      console.log("Loaded answers from saved responses:", loadedAnswers);
    }
  }, [savedResponses]);

  return (
    <div className="flex flex-col w-full h-full border border-black text-white figma-cursor overflow-hidden">
      {/* Error Popup */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#2a2a2a] border border-[#F55F4B] rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-[#F55F4B] text-2xl font-bold mb-4">Oops!</h3>
            <p className="text-white text-lg mb-6">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="w-full px-6 py-3 bg-[#F55F4B] text-white font-medium rounded-2xl hover:bg-[#d94a3a] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <Image
        src="/images/design/background.svg"
        alt="About Design"
        width={1920}
        height={1080}
        draggable={false}
        className="w-full h-full object-cover absolute top-0 left-0"
      />
      <Image
        src="/images/design/acmlogo.svg"
        alt="About Design"
        width={320}
        height={320}
        draggable={false}
        className="w-[12vw] object-cover absolute top-5 left-2 z-30"
      />

      <DesignNavbar
        selected={selectedPanel}
        onSelect={setSelectedPanel}
        roundUser={roundUser}
        roundHidden={roundHidden}
        roundUserCount={roundUserCount}
      />
      <div
        key={selectedPanel}
        className="flex overflow-hidden z-10 animate-panel-transition h-full"
      >
        {selectedPanel === "Home" && (
          <Home
            onGetStarted={initializeRoundUser}
            loading={loading}
            hasRoundUser={!!roundUser}
            onContinue={continueCheck}
          />
        )}
        {selectedPanel === "About" && <About />}
        {selectedPanel === "Instructions" && <Instructions />}
        {selectedPanel === "AOIs" && (
          <AOIs
            joinedAOIs={joinedAOIs}
            onJoinAOI={handleJoinAOI}
            onLeaveAOI={handleLeaveAOI}
            aoiJoinLimit={AOI_JOIN_LIMIT}
          />
        )}
        {selectedPanel === "Questions" &&
          roundUser &&
          roundUser.formSubmission && (
            <Questions
              questions={formQuestions}
              roundUser={roundUser}
              joinedAOIs={joinedAOIs}
              savedAnswers={savedAnswers}
              setSavedAnswers={setSavedAnswers}
              questionsWithUnsavedEdits={questionsWithUnsavedEdits}
              setQuestionsWithUnsavedEdits={setQuestionsWithUnsavedEdits}
              filteredQuestions={filteredQuestions}
              aoiData={aoiData}
              selectedAoi={selectedAoi}
              setSelectedAoi={setSelectedAoi}
              selectedQuestion={selectedQuestion}
              setSelectedQuestion={setSelectedQuestion}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              submittingForm={submittingForm}
              setSubmittingForm={setSubmittingForm}
              showConfirmDialog={showConfirmDialog}
              setShowConfirmDialog={setShowConfirmDialog}
              isProceeding={isProceeding}
              setIsProceeding={setIsProceeding}
              answers={answers}
              setAnswers={setAnswers}
              hasUnsavedChanges={hasUnsavedChanges}
              setHasUnsavedChanges={setHasUnsavedChanges}
              savedResponses={savedResponses}
              setSavedResponses={setSavedResponses}
            />
          )}
        {selectedPanel === "Interview" && <Interview />}
      </div>
    </div>
  );
};

export default DesignClient;
