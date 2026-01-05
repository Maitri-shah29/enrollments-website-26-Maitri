"use client";
import type { Question, Response } from "@prisma/client";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import createResponse from "@/app/actions/create-response";
import submitForm from "@/app/actions/submit-form";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import { getRoundGateState } from "@/lib/round-status";
import type { DesignAOI } from "@/lib/types";

interface TransformedQuestion {
  header: string;
  content: string;
  questionId: string;
}

interface AOIData {
  name: string;
  questions: TransformedQuestion[];
}

//this page has a bit of ai code to accommodate the fe, dont have enough time to actually think abt ts claude is pretty goog tho ngl
interface QuestionsProps {
  questions: Question[];
  roundUser: RoundUserExtended;
  joinedAOIs: Set<DesignAOI>;
  savedAnswers: Record<string, string>; // lifted state from parent
  setSavedAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>; // setter from parent
  questionsWithUnsavedEdits: Set<string>; // lifted state from parent
  setQuestionsWithUnsavedEdits: React.Dispatch<
    React.SetStateAction<Set<string>>
  >; // setter from parent
  filteredQuestions: Question[];
  aoiData: AOIData[];
  selectedAoi: AOIData | null;
  setSelectedAoi: React.Dispatch<React.SetStateAction<AOIData | null>>;
  selectedQuestion: TransformedQuestion | null;
  setSelectedQuestion: React.Dispatch<
    React.SetStateAction<TransformedQuestion | null>
  >;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  submittingForm: boolean;
  setSubmittingForm: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmDialog: boolean;
  setShowConfirmDialog: React.Dispatch<React.SetStateAction<boolean>>;
  isProceeding: boolean;
  setIsProceeding: React.Dispatch<React.SetStateAction<boolean>>;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  savedResponses: Response[];
  setSavedResponses: React.Dispatch<React.SetStateAction<Response[]>>;
  onViewInstructions?: () => void;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

const Questions: React.FC<QuestionsProps> = ({
  questions,
  roundUser,
  joinedAOIs,
  savedAnswers,
  setSavedAnswers,
  questionsWithUnsavedEdits,
  setQuestionsWithUnsavedEdits,
  filteredQuestions,
  aoiData,
  selectedAoi,
  setSelectedAoi,
  selectedQuestion,
  setSelectedQuestion,
  isSaving,
  setIsSaving,
  submittingForm,
  setSubmittingForm,
  showConfirmDialog,
  setShowConfirmDialog,
  isProceeding,
  setIsProceeding,
  answers,
  setAnswers,
  hasUnsavedChanges,
  setHasUnsavedChanges,
  savedResponses,
  setSavedResponses,
  onViewInstructions,
}) => {
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
    setHasUnsavedChanges,
    setIsSaving,
  ]);

  const designAOIToVarName: Record<DesignAOI, string> = {
    uiux: "uiux",
    videoediting: "videoediting",
    illustrations: "illustrations",
    motiongraphics: "motiongraphics",
    "3d": "3d",
  };

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

  const isAnnounced = !!roundUser?.round?.announced;
  const roundGateState = getRoundGateState({
    isActive: !!roundUser?.round?.active,
    isAnnounced,
    status: roundUser?.status,
  });
  // Status-based rendering
  switch (roundGateState) {
    case "inactive":
      return (
        <div className="h-full w-full flex items-center justify-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%] [--scrollbar-thumb:#F55F4B]">
          <div className="text-center">
            <h2 className="text-[#F55F4B] text-3xl font-brushwell mb-4">
              Round currently inactive.
            </h2>
            <p className="text-white text-lg font-coolvetica">
              This round will start soon...
            </p>
          </div>
        </div>
      );
    case "evaluating":
      return (
        <div className="h-full w-full flex items-center justify-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%] [--scrollbar-thumb:#F55F4B]">
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
    case "announced_pending":
      return (
        <div className="h-full w-full flex items-center justify-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%] [--scrollbar-thumb:#F55F4B]">
          <div className="text-center">
            <h2 className="text-[#F55F4B] text-3xl font-brushwell mb-4">
              This round's results have been announced.
            </h2>
            <p className="text-white text-lg font-coolvetica">
              You did not submit answers for this domain.
            </p>
          </div>
        </div>
      );
    case "promoted":
      return (
        <div className="flex-1 w-full flex items-center justify-center flex-col">
          <h2 className="text-[#F55F4B] text-9xl font-brushwell mb-4">
            Congratulations! 🎉
          </h2>
          <p className="text-white text-3xl font-coolvetica">
            You have advanced to Round 2. Please follow the instructions to
            schedule your meet.
          </p>
          {onViewInstructions && (
            <button
              type="button"
              onClick={onViewInstructions}
              className="mt-6 px-6 py-3 bg-[#F55F4B] text-white font-coolvetica text-2xl rounded-full hover:bg-[#ff7a68] transition-colors"
            >
              View Round 2 Instructions
            </button>
          )}
        </div>
      );
    case "rejected":
      return (
        <div className="h-full w-full flex items-center justify-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%] [--scrollbar-thumb:#F55F4B]">
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
    case "content":
    default:
      break;
  }

  // If no AOIs are joined, show a message
  if (joinedAOIs.size === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%] [--scrollbar-thumb:#F55F4B]">
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
      <div className="h-full w-full flex items-center justify-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%] [--scrollbar-thumb:#F55F4B]">
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
    <div className="h-full w-full flex items-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [--scrollbar-thumb:#F55F4B] pb-[3%]">
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
                const anyAnswered = aoi.questions.some((q) => {
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
                        allAnswered
                          ? "bg-green-500"
                          : anyAnswered
                            ? "bg-amber-500"
                            : "bg-white"
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

                    console.log(newAnswer);
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
