"use client";
import type { Question } from "@prisma/client";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import createResponse from "@/app/actions/create-response";
import submitForm from "@/app/actions/submit-form";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import type { DesignAOI } from "@/lib/types";

//this page has a bit of ai code to accommodate the fe, dont have enough time to actually think abt ts claude is pretty goog tho ngl
interface QuestionsProps {
  questions: Question[];
  roundUser: RoundUserExtended;
  joinedAOIs: Set<DesignAOI>;
  savedAnswers?: Record<string, string>; // lifted state from parent
  setSavedAnswers?: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >; // setter from parent
  questionsWithUnsavedEdits?: Set<string>; // lifted state from parent
  setQuestionsWithUnsavedEdits?: React.Dispatch<
    React.SetStateAction<Set<string>>
  >; // setter from parent
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

interface Toast {
  message: string;
  type: "success" | "error";
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

const Questions: React.FC<QuestionsProps> = ({
  questions,
  roundUser,
  joinedAOIs,
  savedAnswers: externalSavedAnswers,
  setSavedAnswers: externalSetSavedAnswers,
  questionsWithUnsavedEdits: externalQuestionsWithUnsavedEdits,
  setQuestionsWithUnsavedEdits: externalSetQuestionsWithUnsavedEdits,
}) => {
  // Map DesignAOI to varName prefixes (these should match the question varNames in your database)
  const designAOIToVarName: Record<DesignAOI, string> = {
    uiux: "uiux",
    videoediting: "videoediting",
    illustrations: "illustrations",
    motiongraphics: "motiongraphics",
    "3d": "3d",
  };

  // Filter questions based on joined AOIs
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

    return questions.filter((q) =>
      Array.from(allowedVarNames).some((varName) =>
        q.varName?.toLowerCase().includes(varName.toLowerCase()),
      ),
    );
  }, [questions, joinedAOIs]);

  const aoiData = useMemo(
    () => groupQuestionsByVarName(filteredQuestions),
    [filteredQuestions],
  );

  const [selectedAoi, setSelectedAoi] = useState<AOIData | null>(
    aoiData[0] || null,
  );
  const [selectedQuestion, setSelectedQuestion] =
    useState<TransformedQuestion | null>(aoiData[0]?.questions[0] || null);
  const [isSaving, setIsSaving] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProceeding, setIsProceeding] = useState<boolean>(false);

  const [answers, setAnswers] = useState<Record<string, string>>({}); //im starting to like this syntax ngl

  // Use external state if provided, otherwise use internal
  const [internalSavedAnswers, setInternalSavedAnswers] = useState<
    Record<string, string>
  >({});
  const [
    internalQuestionsWithUnsavedEdits,
    setInternalQuestionsWithUnsavedEdits,
  ] = useState<Set<string>>(new Set());

  const useExternalSavedState =
    !!externalSavedAnswers &&
    !!externalSetSavedAnswers &&
    !!externalSetQuestionsWithUnsavedEdits;
  const savedAnswers = useExternalSavedState
    ? externalSavedAnswers
    : internalSavedAnswers;
  const setSavedAnswers = useExternalSavedState
    ? externalSetSavedAnswers
    : setInternalSavedAnswers;
  const questionsWithUnsavedEdits = useExternalSavedState
    ? externalQuestionsWithUnsavedEdits || new Set()
    : internalQuestionsWithUnsavedEdits;
  const setQuestionsWithUnsavedEdits = useExternalSavedState
    ? externalSetQuestionsWithUnsavedEdits
    : setInternalQuestionsWithUnsavedEdits;

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: "aoi" | "question";
    target: AOIData | TransformedQuestion;
  } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      // Hide toast after 3 seconds
      setTimeout(() => {
        setToast(null);
      }, 3000);
    },
    [],
  );

  const formSubmissionId = roundUser?.formSubmission?.id || null;
  const savedResponses = roundUser?.formSubmission?.responses || [];

  // Load saved responses into answers state
  useEffect(() => {
    if (savedResponses.length > 0) {
      const loadedAnswers: Record<string, string> = {};
      for (const response of savedResponses) {
        if (response.response) {
          loadedAnswers[response.questionId] = response.response;
        }
      }
      setAnswers(loadedAnswers);
      if (!useExternalSavedState) {
        setInternalSavedAnswers(loadedAnswers);
      } else if (externalSetSavedAnswers) {
        externalSetSavedAnswers(loadedAnswers);
      }
      console.log("Loaded answers from saved responses:", loadedAnswers);
    }
  }, [savedResponses, useExternalSavedState, externalSetSavedAnswers]);

  const handleAoiClick = (aoi: AOIData) => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: "aoi", target: aoi });
      setShowUnsavedDialog(true);
      return;
    }
    setSelectedAoi(aoi);
    setSelectedQuestion(aoi.questions[0]);
  };

  const handleQuestionClick = (question: TransformedQuestion) => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: "question", target: question });
      setShowUnsavedDialog(true);
      return;
    }
    setSelectedQuestion(question);
  };

  const handleSaveResponse = useCallback(async () => {
    if (!formSubmissionId || !selectedQuestion) {
      console.error("Missing required data to save response");
      showToast("Submission failed: Missing form or question data.", "error");
      return;
    }

    const currentAnswer = answers[selectedQuestion.questionId] || "";
    if (!currentAnswer.trim()) {
      console.error("Answer is empty");
      showToast("Submission failed: Please provide an answer.", "error");
      return;
    }

    try {
      setIsSaving(true);
      const result = await createResponse(
        selectedQuestion.questionId,
        formSubmissionId,
        currentAnswer,
        roundUser.id,
      );

      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        result.error
      ) {
        throw new Error(result.error);
      }

      // Update saved answers and clear unsaved edit flag
      setSavedAnswers((prev) => ({
        ...prev,
        [selectedQuestion.questionId]: currentAnswer,
      }));
      setQuestionsWithUnsavedEdits((prev) => {
        const newSet = new Set(prev);
        newSet.delete(selectedQuestion.questionId);
        return newSet;
      });
      setHasUnsavedChanges(false);
      console.log("Response saved successfully");
      showToast("Response saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save response:", error);
      const msg = error instanceof Error ? error.message : "Submission failed";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  }, [
    formSubmissionId,
    selectedQuestion,
    answers,
    showToast,
    setSavedAnswers,
    setQuestionsWithUnsavedEdits,
    roundUser.id,
  ]);

  const handleSubmitForm = () => {
    // Frontend validation before showing confirm dialog
    const joinedVarNames = Array.from(joinedAOIs).map(
      (aoi) => designAOIToVarName[aoi],
    );

    // Get questions for joined AOIs and common
    const questionsToValidate = filteredQuestions.filter(
      (q) =>
        (q.type === "stq" || q.type === "ltq") &&
        (joinedVarNames.includes(q.varName) || q.varName === "common"),
    );

    // Check if all required questions are answered
    const unansweredQuestions = questionsToValidate.filter(
      (q) => !answers[q.id] || answers[q.id].trim() === "",
    );

    if (unansweredQuestions.length > 0) {
      showToast(
        `Please answer all questions. ${unansweredQuestions.length} question(s) remaining.`,
        "error",
      );
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!roundUser?.id) {
      showToast("No round user found", "error");
      setShowConfirmDialog(false);
      return;
    }

    // Get all question IDs for joined AOIs and common questions
    const joinedVarNames = Array.from(joinedAOIs).map(
      (aoi) => designAOIToVarName[aoi],
    );

    const effectiveResponses: Record<string, string> = {};
    for (const question of filteredQuestions) {
      // Include questions from joined AOIs and common
      if (
        (question.type === "stq" || question.type === "ltq") &&
        (joinedVarNames.includes(question.varName) ||
          question.varName === "common")
      ) {
        effectiveResponses[question.id] = answers[question.id] || "";
      }
    }

    setSubmittingForm(true);
    setShowConfirmDialog(false);

    try {
      const result = await submitForm(roundUser.id, effectiveResponses);
      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(
          "Form submitted successfully! Your responses are now being evaluated.",
          "success",
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      console.error("Submit form error:", err);
      showToast("Failed to submit form", "error");
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
  };

  const getToastClasses = (type: "success" | "error") => {
    return type === "success"
      ? "bg-green-500 border-green-700"
      : "bg-red-500 border-red-700";
  };

  const roundUserStatus = roundUser?.status || "pending";
  const isAnnounced = !!roundUser?.round?.announced;
  const isHidden = !!roundUser?.round?.hidden;
  // Status-based rendering
  if (roundUserStatus === "evaluate" || !isAnnounced) {
    return (
      <div className="h-full w-full flex items-center justify-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%]">
        <div className="text-center">
          <h2 className="text-[#F55F4B] text-3xl font-brushwell mb-4">
            Your responses are being evaluated
          </h2>
          <p className="text-white text-lg font-coolvetica">
            Please wait while we review your submission.
          </p>
        </div>
      </div>
    );
  }

  if (roundUserStatus === "promoted" && isAnnounced) {
    return (
      <div className="flex-1 w-full flex items-center justify-center flex-col">
        <h2 className="text-[#F55F4B] text-9xl font-brushwell mb-4">
          Congratulations! 🎉
        </h2>
        <p className="text-white text-3xl font-coolvetica">
          You have been promoted to the next round
        </p>
      </div>
    );
  }

  if (roundUserStatus === "rejected" && isAnnounced) {
    return (
      <div className="h-full w-full flex items-center justify-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%]">
        <div className="text-center">
          <h2 className="text-red-500 text-9xl font-brushwell mb-4">
            Sorry 😞
          </h2>
          <p className="text-white text-3xl font-coolvetica">
            Unfortunately you did not pass this round. <br />
            Thank you for participating. Better luck next time!
          </p>
        </div>
      </div>
    );
  }

  // If no AOIs are joined, show a message
  if (joinedAOIs.size === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%]">
        <h1 className="text-[8vh] lg:text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0 mb-[1.5%]">
          Questions
        </h1>
        <div className="text-white text-center max-w-2xl px-8">
          <p className="text-2xl font-coolvetica mb-4">No AOIs Selected</p>
          <p className="text-lg font-coolvetica text-white/70">
            Please visit the AOIs page to join at least one Area of Interest to
            access questions.
          </p>
        </div>
      </div>
    );
  }

  // If no questions available for joined AOIs
  if (aoiData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%]">
        <h1 className="text-[8vh] lg:text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0 mb-[1.5%]">
          Questions
        </h1>
        <div className="text-white text-center max-w-2xl px-8">
          <p className="text-2xl font-coolvetica mb-4">
            No Questions Available
          </p>
          <p className="text-lg font-coolvetica text-white/70">
            No questions found for your joined AOIs. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  const handleConfirmNavigation = () => {
    setIsProceeding(true);
    handleSaveResponse().then(() => {
      setIsProceeding(false);
      if (pendingNavigation) {
        if (pendingNavigation.type === "aoi") {
          const aoi = pendingNavigation.target as AOIData;
          setSelectedAoi(aoi);
          setSelectedQuestion(aoi.questions[0]);
        } else {
          const question = pendingNavigation.target as TransformedQuestion;
          setSelectedQuestion(question);
        }
      }
      setHasUnsavedChanges(false);
      setShowUnsavedDialog(false);
      setPendingNavigation(null);
    });
  };

  const handleCancelNavigation = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  return (
    <div className="h-full w-full flex items-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%]">
      {showUnsavedDialog && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-2000">
          <div className="bg-[#302E2E] border-2 border-[#F55F4B] p-8 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-[#F55F4B] text-2xl font-brushwell mb-4">
              Unsaved Changes
            </h3>
            <p className="text-white text-lg mb-6 font-coolvetica">
              You have unsaved changes. Save to proceed ahead.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelNavigation}
                className="px-6 py-2 bg-transparent border-2 border-white text-white font-coolvetica hover:bg-white hover:text-black transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNavigation}
                className="px-6 py-2 bg-[#F55F4B] text-white font-coolvetica hover:bg-[#d64f3a] transition-colors"
                type="button"
                disabled={isProceeding}
              >
                {isProceeding ? "Saving..." : "Proceed & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-1000 p-4 rounded-lg shadow-xl text-white font-coolvetica transition-opacity duration-300 ${getToastClasses(
            toast.type,
          )} border-2`}
        >
          {toast.message}
        </div>
      )}
      {showConfirmDialog && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-2000">
          <div className="bg-[#302E2E] border-2 border-[#F55F4B] p-8 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-[#F55F4B] text-2xl font-brushwell mb-4">
              Confirm Submission
            </h3>
            <p className="text-white text-lg mb-6 font-coolvetica">
              You won't be able to edit your responses after this. Are you sure
              you want to submit?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelSubmit}
                className="px-6 py-2 bg-transparent border-2 border-white text-white font-coolvetica hover:bg-white hover:text-black transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-6 py-2 bg-[#F55F4B] text-white font-coolvetica hover:bg-[#d64f3a] transition-colors"
                type="button"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <h1 className="text-[8vh] lg:text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0 mb-[1.5%]">
        Questions
      </h1>
      <div className="flex flex-col lg:flex-row w-full px-[3%] gap-[3%]">
        <div className="w-full lg:w-[25%] mb-[3%] lg:mb-0">
          <div className="relative mb-4 lg:mb-8">
            <div className="absolute -bottom-2.5 -right-2.5 w-full h-full rounded-xl border-2 border-[#43A363]/60"></div>
            <div className="bg-[#43A363] p-4 lg:p-6 rounded-xl flex flex-col gap-2">
              {aoiData.map((aoi) => {
                const allAnswered = aoi.questions.every((q) => {
                  const hasSavedAnswer =
                    savedAnswers[q.questionId]?.trim().length > 0;
                  const hasUnsavedEdit = questionsWithUnsavedEdits.has(
                    q.questionId,
                  );
                  return hasSavedAnswer && !hasUnsavedEdit;
                });
                return (
                  <button
                    type="button"
                    className="flex gap-3 lg:gap-5 items-center cursor-pointer z-100 w-full p-0 border-none bg-transparent text-white text-left"
                    key={aoi.name}
                    onClick={() => handleAoiClick(aoi)}
                  >
                    <div
                      className={`w-6 aspect-square rounded-sm ${
                        allAnswered ? "bg-green-500" : "bg-white"
                      }`}
                    ></div>
                    <p
                      className={`font-coolvetica truncate ${
                        selectedAoi?.name === aoi.name ? "font-bold" : ""
                      }`}
                    >
                      {aoi.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -bottom-2.5 -right-2.5 w-full h-full rounded-xl border-2 border-[#3389E5]/60"></div>
            <div className="bg-[#3389E5] p-8 rounded-xl flex flex-col gap-2">
              {selectedAoi?.questions.map((question) => {
                const hasSavedAnswer =
                  savedAnswers[question.questionId]?.trim().length > 0;
                const hasUnsavedEdit = questionsWithUnsavedEdits.has(
                  question.questionId,
                );
                const hasAnswer = hasSavedAnswer && !hasUnsavedEdit;
                return (
                  <button
                    type="button"
                    className="flex gap-3 lg:gap-5 items-center cursor-pointer z-100 w-full p-0 border-none bg-transparent text-white text-left"
                    key={question.header}
                    onClick={() => handleQuestionClick(question)}
                  >
                    <div
                      className={`w-6 aspect-square rounded-sm ${
                        hasAnswer ? "bg-green-500" : "bg-white"
                      }`}
                    ></div>
                    <p
                      className={`font-coolvetica truncate ${
                        selectedQuestion?.header === question.header
                          ? "font-bold"
                          : ""
                      }`}
                    >
                      {question.header}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full h-full min-h-140 bg-[#302E2E] rounded-xl p-10 text-white flex flex-col">
          {selectedQuestion ? (
            <div className="flex flex-col flex-1">
              <h2 className="text-lg lg:text-xl font-coolvetica mb-1 font-bold text-[#EA86B5]">
                {selectedQuestion.header}
              </h2>
              <p className="text-base lg:text-lg font-coolvetica">
                {selectedQuestion.content}
              </p>
              <div className="h-px my-3 lg:my-5 w-full bg-white"></div>
              <h2 className="text-lg lg:text-xl font-coolvetica mb-1 font-bold text-[#EA86B5]">
                Answer
              </h2>

              <div className="flex-1 min-h-[200px]">
                <textarea
                  value={answers[selectedQuestion.questionId] || ""}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (text.length > 1500) return;

                    const questionId = selectedQuestion.questionId;
                    const newAnswer = e.target.value;
                    setAnswers((prev) => ({
                      ...prev,
                      [questionId]: newAnswer,
                    }));

                    setHasUnsavedChanges(true);
                    // Track unsaved edits if different from saved
                    if (
                      savedAnswers[questionId] !== undefined &&
                      savedAnswers[questionId] !== newAnswer
                    ) {
                      setQuestionsWithUnsavedEdits((prev) =>
                        new Set(prev).add(questionId),
                      );
                    }
                  }}
                  className="
                        w-full h-full
                        resize-none
                        bg-transparent
                        font-coolvetica
                        text-white
                        text-sm lg:text-base
                        outline-none
                        border-none
                        selection:bg-transparent selection:text-[#EA86B5]
                      "
                  placeholder="Type your answer here..."
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {1500 - (answers[selectedQuestion.questionId]?.length ?? 0)}{" "}
                characters left
              </p>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleSaveResponse}
                  disabled={
                    isSaving ||
                    !answers[selectedQuestion.questionId]?.trim() ||
                    !formSubmissionId
                  }
                  className="px-10 py-4 border-2 border-white font-coolvetica rounded-lg hover:bg-[#F55F4B] hover:border-[#F55F4B] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-white"
                >
                  {isSaving ? "Saving..." : "Save Answer"}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  disabled={submittingForm}
                  className="px-10 py-4 border-2 border-white font-coolvetica rounded-lg hover:bg-[#F55F4B] hover:border-[#F55F4B] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-white"
                >
                  {submittingForm ? "Submitting Form..." : "Submit Form"}
                </button>
              </div>
            </div>
          ) : (
            <p>No question selected.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questions;
