"use client";
import type { Prisma } from "@prisma/client";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import saveFormResponse from "@/app/actions/save-form-response";
import type { ResearchAOI } from "@/lib/research-navigation";

export type RoundUserExtended = Prisma.RoundUserGetPayload<{
  include: {
    round: {
      select: {
        id: true;
        number: true;
        domain: true;
        active: true;
        type: true;
        eliminates: true;
        announced: true;
        hidden: true;
        Question: true;
      };
    };
    formSubmission: {
      select: {
        id: true;
        createdAt: true;
        updatedAt: true;
        formSubmittedAt: true;
        valid: true;
        responses: {
          select: {
            id: true;
            questionId: true;
            response: true;
            error: true;
            updatedAt: true;
          };
        };
      };
    };
    Task: true;
    Meet_User: true;
    user: true;
  };
}>;

interface QuestionsProps {
  roundUser?: RoundUserExtended;
  loading?: boolean;
  error?: string | null;
  responses?: Record<string, string>;
  setResponses?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  selectedAOI?: string;
  selectedQuestionIdx?: number;
  onAOIChange?: (aoi: string) => void;
  onQuestionChange?: (idx: number) => void;
  joinedAOIs?: Set<ResearchAOI>;
}

const Questions: React.FC<QuestionsProps> = ({
  roundUser,
  loading = false,
  error = null,
  responses,
  setResponses,
  selectedAOI: propSelectedAOI = "Blockchain",
  selectedQuestionIdx: propSelectedQuestionIdx = 0,
  onAOIChange,
  onQuestionChange,
  joinedAOIs = new Set(),
}) => {
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success",
  );
  const [internalResponses, setInternalResponses] = useState<
    Record<string, string>
  >({});
  const useExternal = !!responses && !!setResponses;
  const effectiveResponses = useExternal ? responses! : internalResponses;
  const updateResponses: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  > = (value) => {
    if (useExternal) {
      setResponses!(value);
    } else {
      setInternalResponses(value);
    }
  };
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize responses from server data
  useEffect(() => {
    if (useExternal) return;
    if (roundUser?.formSubmission?.responses) {
      const initialResponses: Record<string, string> = {};
      roundUser.formSubmission.responses.forEach((response) => {
        if (response.response) {
          initialResponses[response.questionId] = response.response;
        }
      });
      setInternalResponses(initialResponses);
    }
  }, [roundUser?.formSubmission?.responses, useExternal]);

  const autoSaveResponse = useCallback(
    async (questionId: string, response: string) => {
      if (!roundUser?.formSubmission?.id) return;

      try {
        await saveFormResponse(
          roundUser.formSubmission.id,
          questionId,
          response,
        );
      } catch (err) {
        console.error("Auto-save error:", err);
      }
    },
    [roundUser?.formSubmission?.id],
  );

  const handleResponseChange = (questionId: string, response: string) => {
    updateResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));

    // Only auto-save if user is authenticated
    if (!roundUser?.formSubmission?.id) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      autoSaveResponse(questionId, response).catch((err) => {
        console.error("Debounced auto-save error:", err);
      });
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="text-white text-lg text-center py-8">
        Loading questions...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-lg text-center py-8">{error}</div>;
  }

  if (!roundUser) {
    return (
      <div className="text-white text-lg text-center py-8">
        No round user data found. Please click "Get Started" from the Home page.
      </div>
    );
  }

  if (!roundUser.round) {
    return (
      <div className="text-white text-lg text-center py-8">
        No round data found. Please contact support.
      </div>
    );
  }

  if (!Array.isArray(roundUser.round.Question)) {
    return (
      <div className="text-white text-lg text-center py-8">
        No questions found in this round.
      </div>
    );
  }

  const subjectiveQuestions = roundUser.round.Question.filter(
    (question) => question.type === "stq" || question.type === "ltq",
  );

  if (subjectiveQuestions.length === 0) {
    return (
      <div className="text-white text-lg text-center py-8">
        No subjective questions available for this round.
      </div>
    );
  }

  if (joinedAOIs.size === 0) {
    return (
      <div className="text-white text-lg text-center py-8">
        <p className="mb-4">No AOIs selected.</p>
        <p className="text-sm text-gray-400">
          Please visit the Explore page to join at least one Area of Interest to
          access questions.
        </p>
      </div>
    );
  }

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

  const researchAOIToLabel: Record<ResearchAOI, string> = {
    aiml: "AI/ML",
    cybersecurity: "Cybersecurity",
    blockchain: "Blockchain",
    bioinformatics: "Bioinformatics",
    quantumcomputing: "Quantum Computing",
    iot: "IoT",
  };

  const allowedPrefixes = new Set<string>();
  allowedPrefixes.add("common");

  // Add prefixes for joined AOIs
  for (const aoi of joinedAOIs) {
    const label = researchAOIToLabel[aoi];
    const prefix = aoiToPrefixMap[label];
    if (prefix) {
      allowedPrefixes.add(prefix);
    }
  }

  console.log("Joined AOIs:", Array.from(joinedAOIs));
  console.log("Allowed prefixes:", Array.from(allowedPrefixes));

  const accessibleQuestions = subjectiveQuestions.filter((q) => {
    const varNameLower = q.varName?.toLowerCase() || "";
    return Array.from(allowedPrefixes).some((prefix) =>
      varNameLower.startsWith(prefix),
    );
  });

  console.log("Total accessible questions:", accessibleQuestions.length);

  const aoiPrefix = aoiToPrefixMap[propSelectedAOI] || "common";

  if (!allowedPrefixes.has(aoiPrefix) && aoiPrefix !== "common") {
    return (
      <div className="text-white text-lg text-center py-8">
        <p className="mb-4">
          You haven't joined the {propSelectedAOI} area of interest.
        </p>
        <p className="text-sm text-gray-400">
          Please visit the Explore page to join this AOI.
        </p>
      </div>
    );
  }

  const aoiQuestions = accessibleQuestions.filter((q) =>
    q.varName?.toLowerCase().startsWith(aoiPrefix),
  );

  console.log("Selected AOI:", propSelectedAOI);
  console.log("AOI Prefix:", aoiPrefix);
  console.log("Filtered AOI questions:", aoiQuestions.length);
  console.log(
    "Question varNames:",
    aoiQuestions.map((q) => q.varName),
  );

  if (aoiQuestions.length === 0) {
    return (
      <div className="text-white text-lg text-center py-8">
        <p>No questions available for {propSelectedAOI}.</p>
        <p className="text-sm mt-2">
          Looking for questions with prefix: {aoiPrefix}
        </p>
        <p className="text-sm mt-2">
          Total questions in round: {subjectiveQuestions.length}
        </p>
      </div>
    );
  }

  const safeIndex =
    propSelectedQuestionIdx >= 0 &&
    propSelectedQuestionIdx < aoiQuestions.length
      ? propSelectedQuestionIdx
      : 0;
  const currentQuestion = aoiQuestions[safeIndex];
  const currentResponse = currentQuestion
    ? effectiveResponses[currentQuestion.id] || ""
    : "";

  const handleSubmit = async () => {
    if (!currentQuestion || !roundUser?.formSubmission?.id) {
      setNotificationType("error");
      setNotification("No active question or form submission found");
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      await saveFormResponse(
        roundUser.formSubmission.id,
        currentQuestion.id,
        currentResponse,
      );
      setNotificationType("success");
      setNotification("Answer submitted successfully!");
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error("Submit error:", err);
      setNotificationType("error");
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save response";
      setNotification(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = currentResponse.trim() && !submitting;
  const buttonText = submitting ? "Submitting..." : "Submit";
  const buttonColor = canSubmit ? "#7D5BED" : "#4A4A4A";

  return (
    <div className="w-full h-full bg-[#1a1a1a] p-6 overflow-hidden flex flex-col">
      {notification && (
        <div
          className={`fixed top-30 right-8 px-4 py-2 font-mono shadow-lg z-50 text-white border ${
            notificationType === "success"
              ? "bg-[#16171B] border-[#7D5BED]"
              : "bg-[#16171B] border-red-500"
          }`}
        >
          {notification}
        </div>
      )}

      <div className="flex-shrink-0 mb-6">
        <h1 className="text-white break-words leading-tight font-bold text-[18px]">
          Question {safeIndex + 1}: {currentQuestion?.question}
        </h1>
      </div>

      <div className="h-full flex flex-col">
        <div className="relative h-full">
          <div
            className="relative h-full rounded-lg p-4 transition-colors"
            style={{
              border: `2px solid ${isFocused ? "#7D5BED" : "#C8B7FF"}`,
            }}
          >
            <button
              type="button"
              aria-label="Edit"
              className="absolute right-4 top-4 z-10 text-gray-400 hover:text-white transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
                aria-label="Edit icon"
              >
                <title>Edit</title>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>

            <textarea
              className="
                w-full 
                h-full 
                bg-transparent 
                text-white 
                leading-normal
                resize-none 
                outline-none 
                border-none
                p-0
                placeholder-gray-500
                selection:bg-[#7D5BED]
              "
              placeholder="Type your answer here..."
              value={currentResponse}
              onChange={(e) =>
                currentQuestion &&
                handleResponseChange(currentQuestion.id, e.target.value)
              }
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        </div>

        <div className="flex justify-end flex-shrink-0 mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`text-white font-medium transition-all duration-200 w-45 h-10 rounded-md bg-[${buttonColor}] border-1 hover:cursor-pointer`}
            style={{
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Questions;
