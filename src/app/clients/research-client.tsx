"use client";
import { useCallback, useEffect, useState } from "react";
import About from "@/app/clients/components/research/about";
import AOIs from "@/app/clients/components/research/aoi";
import AIML from "@/app/clients/components/research/aoi-pages/aiml";
import Bioinformatics from "@/app/clients/components/research/aoi-pages/bioinformatics";
import Blockchain from "@/app/clients/components/research/aoi-pages/blockchain";
import Cybersecurity from "@/app/clients/components/research/aoi-pages/cybersecurity";
import IoT from "@/app/clients/components/research/aoi-pages/iot";
import QuantumComputing from "@/app/clients/components/research/aoi-pages/quantumcomputing";
import ExploreResearchAOIs from "@/app/clients/components/research/explore";
import ResearchHome from "@/app/clients/components/research/home";
import Instructions from "@/app/clients/components/research/instructions";
import Interview from "@/app/clients/components/research/interview";
import Questions, {
  type RoundUserExtended,
} from "@/app/clients/components/research/questions";
import ResearchNavbar from "@/app/clients/components/research/research-navbar";
import { DOMAIN_CAP } from "@/lib/constants";
import type { ResearchAOI } from "@/lib/research-navigation";
import { useResearchNavigation } from "@/lib/research-navigation";
import createRoundUser from "../actions/create-round-user";

const AOI_KEYS = [
  "COMMON",
  "AIML",
  "CYBERSECURITY",
  "BLOCKCHAIN",
  "BIOINFORMATICS",
  "QUANTUMCOMPUTING",
  "IOT",
] as const;
type AoiKey = (typeof AOI_KEYS)[number];

const AOI_JOIN_LIMIT = 3;

const keyToLabel: Record<AoiKey, string> = {
  COMMON: "Common",
  AIML: "AI/ML",
  CYBERSECURITY: "Cybersecurity",
  BLOCKCHAIN: "Blockchain",
  BIOINFORMATICS: "Bioinformatics",
  QUANTUMCOMPUTING: "Quantum Computing",
  IOT: "IoT",
};

const labelToKey: Record<string, AoiKey> = Object.fromEntries(
  (Object.keys(keyToLabel) as AoiKey[]).map((k) => [
    keyToLabel[k].toLowerCase(),
    k,
  ]),
) as Record<string, AoiKey>;

function toAoiKey(input: string): AoiKey | null {
  if (!input) return null;
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase().replace(/\s+/g, "");
  const keyMatch = (AOI_KEYS as readonly string[]).find(
    (k) => k === upper || k === trimmed.toUpperCase(),
  ) as AoiKey | undefined;
  if (keyMatch) return keyMatch;

  const labelMatch = labelToKey[trimmed.toLowerCase()];
  return labelMatch ?? null;
}

type ResearchClientProps = {
  initialRoundUser?: RoundUserExtended | null;
  roundUserCount: number;
};

const ResearchClient = ({
  initialRoundUser,
  roundUserCount,
}: ResearchClientProps) => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");
  const [selectedAOI, setSelectedAOI] = useState<string>("Common");
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);
  const [roundUser, setRoundUser] = useState<RoundUserExtended | null>(
    initialRoundUser ?? null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [savedResponses, setSavedResponses] = useState<Record<string, string>>(
    {},
  );
  const [questionsWithUnsavedEdits, setQuestionsWithUnsavedEdits] = useState<
    Set<string>
  >(new Set());
  const [formSubmissionId, setFormSubmissionId] = useState<string | null>(null);
  const [joinedAOIs, setJoinedAOIs] = useState<Set<ResearchAOI>>(new Set());
  const [aoisLoaded, setAoisLoaded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: "aoi" | "question";
    value: string | number;
  } | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState<boolean>(false);
  const roundActive = !!roundUser?.round?.active;
  const roundHidden = !!roundUser?.round?.hidden;
  const {
    activeSection,
    aoiExpanded,
    roundExpanded,
    activeRoundFolder,
    activeQuestion,
    setSection,
    toggleAoi,
    toggleRound,
  } = useResearchNavigation();

  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(
    new Set(),
  );

  // Load joined AOIs from localStorage on mount
  useEffect(() => {
    const savedAOIs = localStorage.getItem("research-joined-aois");
    if (savedAOIs) {
      try {
        const parsed = JSON.parse(savedAOIs) as ResearchAOI[];
        console.log("Restored Research AOIs from localStorage:", parsed);
        setJoinedAOIs(new Set(parsed));
      } catch (err) {
        console.error("Failed to parse saved Research AOIs:", err);
      }
    }
    setAoisLoaded(true);
  }, []);

  // Save joined AOIs to localStorage when they change
  useEffect(() => {
    if (!aoisLoaded) return;
    const aoiArray = [...joinedAOIs];
    console.log("Saving Research AOIs to localStorage:", aoiArray);
    localStorage.setItem("research-joined-aois", JSON.stringify(aoiArray));
  }, [joinedAOIs, aoisLoaded]);

  // Track if current question has unsaved changes
  useEffect(() => {
    const currentKey = `${selectedAOI}-question${selectedQuestionIdx + 1}`;
    setHasUnsavedChanges(questionsWithUnsavedEdits.has(currentKey));
  }, [selectedAOI, selectedQuestionIdx, questionsWithUnsavedEdits]);

  const handleJoinAOI = (aoi: ResearchAOI) => {
    if (joinedAOIs.size < AOI_JOIN_LIMIT) {
      setJoinedAOIs((prev) => new Set([...prev, aoi]));
    }
  };

  const handleLeaveAOI = (aoi: ResearchAOI) => {
    setJoinedAOIs((prev) => {
      const newSet = new Set(prev);
      newSet.delete(aoi);
      return newSet;
    });
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
      const result = await createRoundUser("research");
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

  useEffect(() => {
    if (!roundUser?.formSubmission) return;
    const _savedAnswers: Record<string, string | null> = {};
    const currentFsId = roundUser.formSubmission.id;
    const questions = roundUser.round?.Question || [];
    const submittedResponses: string[] = [];
    if (formSubmissionId !== currentFsId) {
      const initial: Record<string, string> = {};
      const saved: Record<string, string> = {};
      const serverResponses = roundUser.formSubmission.responses ?? [];
      serverResponses.forEach((r) => {
        const question = questions.find((q) => q.id === r.questionId);
        if (question) {
          const AOIQuestions = questions
            .filter((q) => q.varName === question.varName)
            .sort((a, b) => a.serial - b.serial);
          const questionIndex = AOIQuestions.findIndex(
            (q) => q.id === question.id,
          );
          if (questionIndex !== -1) {
            const questionKey = `${question.varName}-question${
              questionIndex + 1
            }`;
            submittedResponses.push(questionKey);
          }
          if (r.response) {
            initial[r.questionId] = r.response;
            saved[r.questionId] = r.response;
          }
        }
      });
      setResponses(initial);
      setSavedResponses(saved);
      setSubmittedQuestions(new Set(submittedResponses));
      setFormSubmissionId(currentFsId);
    }
  }, [roundUser?.formSubmission, roundUser?.round?.Question, formSubmissionId]);

  // ✅ Memoized so it never re-creates between renders
  const handleAOISelect = useCallback(
    (aoi: string) => {
      if (hasUnsavedChanges && selectedPanel === "Round 1") {
        setPendingNavigation({ type: "aoi", value: aoi });
        setShowUnsavedDialog(true);
        return;
      }
      const key = toAoiKey(aoi);
      if (key) {
        setSelectedAOI(keyToLabel[key]);
        setSelectedPanel(key);
        setSelectedQuestionIdx(0);
      } else {
        setSelectedPanel("AOIs");
      }
    },
    [hasUnsavedChanges, selectedPanel],
  );

  // ✅ Memoized to keep `onSelect` stable for AOIs
  const handlePanelSelect = useCallback(
    (panelName: string) => {
      if (
        hasUnsavedChanges &&
        selectedPanel === "Round 1" &&
        panelName !== "Round 1"
      ) {
        setPendingNavigation({ type: "aoi", value: panelName });
        setShowUnsavedDialog(true);
        return;
      }
      const key = toAoiKey(panelName);
      if (key) {
        setSelectedAOI(keyToLabel[key]);
        setSelectedQuestionIdx(0);
        setSelectedPanel(key);
        return;
      }

      setSelectedPanel(panelName);
    },
    [hasUnsavedChanges, selectedPanel],
  );

  const handleQuestionSelect = useCallback(
    (idx: number) => {
      if (
        hasUnsavedChanges &&
        selectedPanel === "Round 1" &&
        idx !== selectedQuestionIdx
      ) {
        setPendingNavigation({ type: "question", value: idx });
        setShowUnsavedDialog(true);
        return;
      }
      setSelectedQuestionIdx(idx);
      setSelectedPanel("Round 1");
    },
    [hasUnsavedChanges, selectedPanel, selectedQuestionIdx],
  );

  const handleConfirmNavigation = useCallback(() => {
    setShowUnsavedDialog(false);
    if (!pendingNavigation) return;

    if (pendingNavigation.type === "aoi") {
      const aoi = pendingNavigation.value as string;
      const key = toAoiKey(aoi);
      if (key) {
        setSelectedAOI(keyToLabel[key]);
        setSelectedPanel(key);
        setSelectedQuestionIdx(0);
      } else {
        setSelectedPanel(aoi);
      }
    } else if (pendingNavigation.type === "question") {
      setSelectedQuestionIdx(pendingNavigation.value as number);
      setSelectedPanel("Round 1");
    }
    setPendingNavigation(null);
  }, [pendingNavigation]);

  const handleCancelNavigation = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  }, []);

  return (
    <div className="flex h-full w-full bg-[#1a1a1a] select-none">
      {/* Error Popup */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border-2 border-[#C8B7FF] rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-[#C8B7FF] text-2xl font-semibold mb-4">
              Oops!
            </h3>
            <p className="text-white text-lg mb-6">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="w-full px-6 py-2 bg-[#C8B7FF] text-[#1a1a1a] font-medium rounded-lg hover:bg-[#a89be0] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border-2 border-[#7D5BED] rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-[#7D5BED] text-2xl font-semibold mb-4">
              Unsaved Changes
            </h3>
            <p className="text-white text-lg mb-6">
              You have unsaved changes. If you leave now, your changes will be
              lost. Do you want to continue?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancelNavigation}
                className="px-6 py-2 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black transition-colors rounded-lg"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={handleConfirmNavigation}
                className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-lg"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
      <ResearchNavbar
        activeSection={activeSection}
        onChangeSection={setSection}
        aoiExpanded={aoiExpanded}
        onToggleAoi={toggleAoi}
        roundExpanded={roundExpanded}
        onToggleRound={toggleRound}
        activeQuestion={`question${activeQuestion + 1}`}
        activeRoundFolder={activeRoundFolder}
        selected={selectedPanel}
        onSelect={handlePanelSelect}
        selectedAOI={selectedAOI}
        selectedQuestionIdx={selectedQuestionIdx}
        submittedQuestions={submittedQuestions}
        questionsWithUnsavedEdits={questionsWithUnsavedEdits}
        onAOISelect={handleAOISelect}
        onQuestionSelect={handleQuestionSelect}
        roundUser={roundUser}
        joinedAOIs={joinedAOIs}
        roundHidden={roundHidden}
        roundUserCount={roundUserCount}
      />

      <div className="flex-1 min-w-0 h-full overflow-hidden">
        {selectedPanel === "Home" && (
          <ResearchHome
            onGetStarted={initializeRoundUser}
            loading={loading}
            hasRoundUser={!!roundUser}
            onContinue={() => setSelectedPanel("About")}
          />
        )}
        {selectedPanel === "About" && <About />}
        {selectedPanel === "Instructions" && <Instructions />}
        {selectedPanel === "AOIs" && <AOIs onSelect={handlePanelSelect} />}
        {selectedPanel === "Explore" && (
          <ExploreResearchAOIs
            joinedAOIs={joinedAOIs}
            onJoinAOI={handleJoinAOI}
            onLeaveAOI={handleLeaveAOI}
          />
        )}
        {selectedPanel === "Round 1" && !roundActive ? (
          <div className="text-center text-white text-xl py-12">
            <h1 className="text-2xl font-bold mb-4">
              Round currently inactive.
            </h1>
            <p>This round will start soon...</p>
          </div>
        ) : selectedPanel === "Round 1" ? (
          <Questions
            roundUser={roundUser ?? undefined}
            loading={loading}
            error={error}
            responses={responses}
            setResponses={setResponses}
            savedResponses={savedResponses}
            setSavedResponses={setSavedResponses}
            questionsWithUnsavedEdits={questionsWithUnsavedEdits}
            setQuestionsWithUnsavedEdits={setQuestionsWithUnsavedEdits}
            selectedAOI={selectedAOI}
            selectedQuestionIdx={selectedQuestionIdx}
            onAOIChange={setSelectedAOI}
            onQuestionChange={setSelectedQuestionIdx}
            joinedAOIs={joinedAOIs}
            onSubmit={(key) =>
              setSubmittedQuestions((prev) => new Set([...prev, key]))
            }
          />
        ) : null}
        {selectedPanel === "Interview" && <Interview />}

        {selectedPanel === "AIML" && <AIML />}
        {selectedPanel === "CYBERSECURITY" && <Cybersecurity />}
        {selectedPanel === "BLOCKCHAIN" && <Blockchain />}
        {selectedPanel === "BIOINFORMATICS" && <Bioinformatics />}
        {selectedPanel === "QUANTUMCOMPUTING" && <QuantumComputing />}
        {selectedPanel === "IOT" && <IoT />}
      </div>
    </div>
  );
};

export default ResearchClient;
