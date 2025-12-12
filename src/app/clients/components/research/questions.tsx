"use client";
import type { Prisma } from "@prisma/client";
import Image from "next/image";
import type React from "react";
import { useEffect, useState } from "react";
import saveFormResponse from "@/app/actions/save-form-response";
import submitForm from "@/app/actions/submit-form";
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
  savedResponses?: Record<string, string>;
  setSavedResponses?: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  questionsWithUnsavedEdits?: Set<string>;
  setQuestionsWithUnsavedEdits?: React.Dispatch<
    React.SetStateAction<Set<string>>
  >;
  selectedAOI?: string;
  selectedQuestionIdx?: number;
  onAOIChange?: (aoi: string) => void;
  onQuestionChange?: (idx: number) => void;
  joinedAOIs?: Set<ResearchAOI>;
  onSubmit: (key: string) => void;
}

const Questions: React.FC<QuestionsProps> = ({
  roundUser,
  loading = false,
  error = null,
  responses,
  setResponses,
  savedResponses: externalSavedResponses,
  setSavedResponses: externalSetSavedResponses,
  questionsWithUnsavedEdits: externalQuestionsWithUnsavedEdits,
  setQuestionsWithUnsavedEdits: externalSetQuestionsWithUnsavedEdits,
  selectedAOI: propSelectedAOI = "Blockchain",
  selectedQuestionIdx: propSelectedQuestionIdx = 0,
  onAOIChange: _onAOIChange,
  onQuestionChange: _onQuestionChange,
  onSubmit,
  joinedAOIs = new Set(),
}) => {
  const questionKey = `${propSelectedAOI}-question${
    propSelectedQuestionIdx + 1
  }`;
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success",
  );
  const [internalResponses, setInternalResponses] = useState<
    Record<string, string>
  >({});
  const [internalSavedResponses, setInternalSavedResponses] = useState<
    Record<string, string>
  >({});
  const [
    internalQuestionsWithUnsavedEdits,
    setInternalQuestionsWithUnsavedEdits,
  ] = useState<Set<string>>(new Set());
  const useExternal = !!responses && !!setResponses;
  const effectiveResponses =
    useExternal && responses ? responses : internalResponses;
  const updateResponses: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  > = (value) => {
    if (useExternal) {
      setResponses?.(value);
    } else {
      setInternalResponses(value);
    }
  };
  const useExternalSavedState =
    !!externalSavedResponses &&
    !!externalSetSavedResponses &&
    !!externalSetQuestionsWithUnsavedEdits;
  const savedResponses = useExternalSavedState
    ? externalSavedResponses
    : internalSavedResponses;
  const setSavedResponses = useExternalSavedState
    ? externalSetSavedResponses
    : setInternalSavedResponses;
  const _questionsWithUnsavedEdits = useExternalSavedState
    ? externalQuestionsWithUnsavedEdits || new Set()
    : internalQuestionsWithUnsavedEdits;
  const setQuestionsWithUnsavedEdits = useExternalSavedState
    ? externalSetQuestionsWithUnsavedEdits
    : setInternalQuestionsWithUnsavedEdits;
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittingForm, setSubmittingForm] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState(false);

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

  // Initialize saved responses from server data
  useEffect(() => {
    if (roundUser?.formSubmission?.responses && !useExternalSavedState) {
      const saved: Record<string, string> = {};
      roundUser.formSubmission.responses.forEach((response) => {
        if (response.response) {
          saved[response.questionId] = response.response;
        }
      });
      setInternalSavedResponses(saved);
    }
  }, [roundUser?.formSubmission?.responses, useExternalSavedState]);

  const handleResponseChange = (questionId: string, response: string) => {
    updateResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));
    // Track that this question has unsaved edits if it differs from saved
    const savedResponse = savedResponses[questionId] || "";
    if (savedResponse !== response) {
      // Has unsaved changes
      setQuestionsWithUnsavedEdits((prev) => new Set(prev).add(questionKey));
    } else {
      // Matches saved response, remove from unsaved
      setQuestionsWithUnsavedEdits((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionKey);
        return newSet;
      });
    }
  };

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
    onSubmit(questionKey);
    setSubmitting(true);
    setNotification(null);

    try {
      await saveFormResponse(
        roundUser.formSubmission.id,
        currentQuestion.id,
        currentResponse,
      );
      setSavedResponses((prev) => ({
        ...prev,
        [currentQuestion.id]: currentResponse,
      }));
      setQuestionsWithUnsavedEdits((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionKey);
        return newSet;
      });
      setNotificationType("success");
      setNotification("Answer saved successfully!");
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

  const handleSubmitForm = () => {
    // Frontend validation before showing confirm dialog
    const questionsToValidate = accessibleQuestions;

    // Check if all required questions are answered
    const unansweredQuestions = questionsToValidate.filter(
      (q) =>
        !effectiveResponses[q.id] || effectiveResponses[q.id].trim() === "",
    );

    if (unansweredQuestions.length > 0) {
      console.log("hi");
      console.log(unansweredQuestions);
      setNotificationType("error");
      setNotification(
        `Please answer all questions. ${unansweredQuestions.length} question(s) remaining.`,
      );
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    // Check if all questions are saved
    const unsavedQuestions = questionsToValidate.filter((q) => {
      const currentAnswer = effectiveResponses[q.id] || "";
      const savedAnswer = savedResponses[q.id] || "";
      // Question is unsaved if current answer differs from saved
      return currentAnswer !== savedAnswer;
    });

    if (unsavedQuestions.length > 0) {
      setNotificationType("error");
      setNotification(
        `Please save all answers before submitting. ${unsavedQuestions.length} question(s) have unsaved changes.`,
      );
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!roundUser?.id) {
      setNotificationType("error");
      setNotification("No round user found");
      setShowConfirmDialog(false);
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Build effective responses for joined AOIs and common questions
    const effectiveResponsesToSubmit: Record<string, string> = {};
    for (const question of accessibleQuestions) {
      effectiveResponsesToSubmit[question.id] =
        effectiveResponses[question.id] || "";
    }

    setSubmittingForm(true);
    setShowConfirmDialog(false);
    setNotification(null);

    try {
      const result = await submitForm(roundUser.id, effectiveResponsesToSubmit);
      if (result.error) {
        setNotificationType("error");
        setNotification(result.error);
      } else {
        setNotificationType("success");
        setNotification(
          "Form submitted successfully! Your responses are now being evaluated.",
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      console.error("Submit form error:", err);
      setNotificationType("error");
      setNotification("Failed to submit form");
    } finally {
      setSubmittingForm(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
  };

  const roundUserStatus = roundUser?.status || "pending";
  const isAnnounced = !!roundUser?.round?.announced;
  const isHidden = !!roundUser?.round?.hidden;
  if (isHidden) {
    return (
      <div className="w-full h-full bg-[#1a1a1a] p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#7D5BED] text-3xl font-bold mb-4">
            The round youre looking for is not available.
          </h2>
          <p className="text-white text-lg">
            Please contact support for more information.
          </p>
        </div>
      </div>
    );
  }
  // Status-based rendering
  if (roundUserStatus === "evaluate" || !isAnnounced) {
    return (
      <div className="w-full h-full bg-[#1a1a1a] p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#7D5BED] text-3xl font-bold mb-4">
            Your responses are being evaluated
          </h2>
          <p className="text-white text-lg">
            Please wait while we review your submission.
          </p>
        </div>
      </div>
    );
  }

  if (roundUserStatus === "promoted" && isAnnounced) {
    return (
      <div className="w-full h-full bg-[#1a1a1a] p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#7D5BED] text-3xl font-bold mb-4">
            Congratulations! 🎉
          </h2>
          <p className="text-white text-lg">
            You are promoted to the next round
          </p>
        </div>
      </div>
    );
  }

  if (roundUserStatus === "rejected" && isAnnounced) {
    return (
      <div className="w-full h-full bg-[#1a1a1a] p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-red-500 text-3xl font-bold mb-4">
            Unfortunately, you could not pass this round
          </h2>
          <p className="text-white text-lg">
            Thank you for participating. Better luck next time!
          </p>
        </div>
      </div>
    );
  }

  const canSubmit = currentResponse.trim() && !submitting;
  const buttonText = submitting ? "Saving..." : "Save Answer";
  const buttonColor = canSubmit ? "#7D5BED" : "#4A4A4A";

  return (
    <div className="w-full h-full bg-[#1a1a1a] p-6 overflow-hidden flex flex-col">
      {notification && (
        <div
          className={`fixed top-30 right-8 px-4 py-2 font-mono shadow-lg z-50 text-white border ${
            notificationType === "success"
              ? "bg-[#1a1a1a] border-[#7D5BED]"
              : "bg-[#1a1a1a] border-red-500"
          }`}
        >
          {notification}
        </div>
      )}
      {showConfirmDialog && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-[2000]">
          <div className="bg-[#1a1a1a] border-2 border-[#7D5BED] p-8 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-[#7D5BED] text-2xl font-bold mb-4">
              Confirm Submission
            </h3>
            <p className="text-white text-lg mb-6">
              You won't be able to edit your responses after this. Are you sure
              you want to submit?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelSubmit}
                className="px-6 py-2 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-6 py-2 bg-[#7D5BED] text-white hover:bg-[#6a4dd4] transition-colors"
                type="button"
                disabled={submittingForm}
              >
                {submittingForm ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="shrink-0 mb-6">
        <h1 className="text-white wrap-break-words leading-tight font-bold text-[18px]">
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
              <Image
                src="/images/research/question-edit-icon.svg"
                width={20}
                height={20}
                alt="Edit"
                draggable={false}
              />
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
                select-text
              "
              placeholder="Type your answer here..."
              value={currentResponse}
              onChange={(e) => {
                const text = e.target.value;

                if (text.length > 1500) return;

                currentQuestion &&
                  handleResponseChange(currentQuestion.id, e.target.value);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {1500 - currentResponse.length} characters left
          </p>
        </div>

        <div className="flex justify-end flex-shrink-0 mt-4 space-x-4">
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
          {roundUser?.status === "pending" && (
            <button
              type="button"
              onClick={handleSubmitForm}
              disabled={submittingForm}
              className="text-white font-medium transition-all duration-200 w-45 h-10 rounded-md bg-[#7D5BED] border-1 hover:bg-[#6a4dd4] hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingForm ? "Submitting..." : "Submit Form"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questions;
