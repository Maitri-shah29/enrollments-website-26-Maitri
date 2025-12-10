"use client";
import type { Prisma } from "@prisma/client";
import type React from "react";
import { useEffect, useState } from "react";
import saveFormResponse from "@/app/actions/save-form-response";
import submitForm from "@/app/actions/submit-form";
import AnswerBox from "./answer-box";
import Button from "./button";
import QuestionBox from "./question-box";
import QuestionList from "./question-list";

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
}> & {
  id: string;
  status: "pending" | "evaluate" | "promoted" | "rejected";
};
type QuestionsProps = {
  roundUser?: RoundUserExtended;
  loading?: boolean;
  error?: string | null;
  responses?: Record<string, string>; // lifted state from parent
  setResponses?: React.Dispatch<React.SetStateAction<Record<string, string>>>; // setter from parent
  savedResponses?: Record<string, string>; // lifted state from parent
  setSavedResponses?: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >; // setter from parent
  questionsWithUnsavedEdits?: Set<string>; // lifted state from parent
  setQuestionsWithUnsavedEdits?: React.Dispatch<
    React.SetStateAction<Set<string>>
  >; // setter from parent
};

const Questions = ({
  roundUser,
  loading = false,
  error = null,
  responses,
  setResponses,
  savedResponses: externalSavedResponses,
  setSavedResponses: externalSetSavedResponses,
  questionsWithUnsavedEdits: externalQuestionsWithUnsavedEdits,
  setQuestionsWithUnsavedEdits: externalSetQuestionsWithUnsavedEdits,
}: QuestionsProps) => {
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success",
  );
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [internalResponses, setInternalResponses] = useState<
    Record<string, string>
  >({});
  const useExternal = !!responses && !!setResponses;
  const effectiveResponses = useExternal ? responses : internalResponses;
  const updateResponses: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  > = (value) => {
    if (useExternal && setResponses) {
      setResponses(value);
    } else {
      setInternalResponses(value);
    }
  };
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("plaintext");
  const [submittingForm, setSubmittingForm] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(
    null,
  );
  const [showUnsavedDialog, setShowUnsavedDialog] = useState<boolean>(false);

  const [internalSavedResponses, setInternalSavedResponses] = useState<
    Record<string, string>
  >({});
  const [
    internalQuestionsWithUnsavedEdits,
    setInternalQuestionsWithUnsavedEdits,
  ] = useState<Set<string>>(new Set());

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
  const questionsWithUnsavedEdits = useExternalSavedState
    ? externalQuestionsWithUnsavedEdits || new Set()
    : internalQuestionsWithUnsavedEdits;
  const setQuestionsWithUnsavedEdits = useExternalSavedState
    ? externalSetQuestionsWithUnsavedEdits
    : setInternalQuestionsWithUnsavedEdits;

  const serverResponses = roundUser?.formSubmission?.responses;

  useEffect(() => {
    if (useExternal) return;
    if (serverResponses) {
      const initialResponses: Record<string, string> = {};
      serverResponses.forEach((response) => {
        if (response.response) {
          initialResponses[response.questionId] = response.response;
        }
      });
      setInternalResponses(initialResponses);
    }
  }, [useExternal, serverResponses]);

  useEffect(() => {
    if (serverResponses && !useExternalSavedState) {
      const saved: Record<string, string> = {};
      serverResponses.forEach((response) => {
        if (response.response) {
          saved[response.questionId] = response.response;
        }
      });
      setInternalSavedResponses(saved);
    }
  }, [serverResponses, useExternalSavedState]);

  // Stable references for questions
  const questions = roundUser?.round?.Question;
  const firstSubjectiveQuestionId = questions?.find(
    (q) => q.type === "stq" || q.type === "ltq",
  )?.id;

  useEffect(() => {
    if (!questions || !Array.isArray(questions)) return;
    if (firstSubjectiveQuestionId && !activeQuestionId) {
      setActiveQuestionId(firstSubjectiveQuestionId);
    }
  }, [firstSubjectiveQuestionId, activeQuestionId, questions]);

  const handleQuestionSelect = (questionId: string) => {
    if (hasUnsavedChanges) {
      setPendingQuestionId(questionId);
      setShowUnsavedDialog(true);
      return;
    }
    setActiveQuestionId(questionId);
  };

  const handleResponseChange = (questionId: string, response: string) => {
    updateResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));
    setHasUnsavedChanges(true);
    // Track that this question has unsaved edits if it differs from saved
    if (
      savedResponses[questionId] !== undefined &&
      savedResponses[questionId] !== response
    ) {
      setQuestionsWithUnsavedEdits((prev) => new Set(prev).add(questionId));
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
  if (
    !roundUser ||
    !roundUser.round ||
    !Array.isArray(roundUser.round.Question)
  ) {
    return (
      <div className="text-white text-lg text-center py-8">
        No round user data found.
      </div>
    );
  }

  const subjectiveQuestions = roundUser.round.Question.filter(
    (question) => question.type === "stq" || question.type === "ltq",
  );

  const questionsForList = subjectiveQuestions.map((question) => ({
    id: question.id,
    serial: question.serial,
    title: question.helpText || "CC Question",
    difficulty: question.varName,
  }));

  const activeQuestion = subjectiveQuestions.find(
    (q) => q.id === activeQuestionId,
  );

  const currentResponse = activeQuestionId
    ? effectiveResponses[activeQuestionId] || ""
    : "";

  const getSubmitMessage = (language: string): string => {
    const messages: Record<string, string> = {
      plaintext: "Still using notepad? Answer Submitted",
      cpp: "Still hand-cranking those memory allocations? Answer Submitted",
      c: "Still trusting yourself with pointers? Answer Submitted",
      java: "Still waiting for the Garbage Collector?  Answer Submitted",
      python: "Still relying on dynamic typing? Answer Submitted",
      javascript: "Still managing callback hell? Answer Submitted",
      typescript: "TypeScript solution compiled and submitted! 💙",
      rust: "Still fighting the borrow checker? Answer Submitted",
      go: "Still waiting on generics? Wait, you got 'em now! Answer Submitted",
    };
    return messages[language] || "Answer submitted successfully!";
  };

  const handleSubmit = async () => {
    if (!activeQuestion || !roundUser?.formSubmission?.id) {
      setNotificationType("error");
      setNotification("No active question or form submission found");
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      await saveFormResponse(
        roundUser.formSubmission.id,
        activeQuestion.id,
        currentResponse,
      );
      setHasUnsavedChanges(false);
      setSavedResponses((prev) => ({
        ...prev,
        [activeQuestion.id]: currentResponse,
      }));

      setQuestionsWithUnsavedEdits((prev) => {
        const newSet = new Set(prev);
        newSet.delete(activeQuestion.id);
        return newSet;
      });
      setNotificationType("success");
      setNotification(getSubmitMessage(selectedLanguage));
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
    const unansweredQuestions = subjectiveQuestions.filter((question) => {
      const response = effectiveResponses[question.id];
      return !response || response.trim() === "";
    });

    if (unansweredQuestions.length > 0) {
      setNotificationType("error");
      setNotification(
        `Please answer all questions before submitting. ${unansweredQuestions.length} question(s) remaining.`,
      );
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    // Check if all questions are saved
    const unsavedQuestions = subjectiveQuestions.filter((q) => {
      const currentAnswer = effectiveResponses[q.id] || "";
      const savedAnswer = savedResponses[q.id];
      // Question is unsaved if: no saved answer exists OR current answer differs from saved
      return savedAnswer === undefined || currentAnswer !== savedAnswer;
    });

    if (unsavedQuestions.length > 0) {
      setNotificationType("error");
      setNotification(
        `Please save all answers before submitting. ${unsavedQuestions.length} question(s) have unsaved changes.`,
      );
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!roundUser?.id) {
      setNotificationType("error");
      setNotification("No round user found");
      setShowConfirmDialog(false);
      return;
    }

    setSubmittingForm(true);
    setShowConfirmDialog(false);
    setNotification(null);

    try {
      const result = await submitForm(roundUser.id, effectiveResponses);
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
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
  };

  const handleConfirmQuestionChange = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    if (pendingQuestionId) {
      setActiveQuestionId(pendingQuestionId);
      setPendingQuestionId(null);
    }
  };

  const handleCancelQuestionChange = () => {
    setShowUnsavedDialog(false);
    setPendingQuestionId(null);
  };

  // Check round user status
  const roundUserStatus = roundUser?.status || "pending";

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
  if (
    !roundUser ||
    !roundUser.round ||
    !Array.isArray(roundUser.round.Question)
  ) {
    return (
      <div className="text-white text-lg text-center py-8">
        No round user data found.
      </div>
    );
  }

  // Status-based rendering
  if (roundUserStatus === "evaluate") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-[#C9EB3E] text-3xl font-ShareTechMono mb-4">
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
          <h2 className="text-[#C9EB3E] text-3xl font-ShareTechMono mb-4">
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
          <h2 className="text-red-500 text-3xl font-ShareTechMono mb-4">
            Unfortunately, you could not pass this round
          </h2>
          <p className="text-white text-lg">
            Thank you for participating. Better luck next time!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 min-h-full">
      {notification && (
        <div
          className={`fixed top-30 right-8 px-4 py-2 font-ShareTechMono shadow-lg z-50 text-white border-[0.2px] border-[#C9EB3E] ${
            notificationType === "success" ? "bg-[#16171B]" : "bg-[#16171B]"
          }`}
        >
          {notification}
        </div>
      )}
      {showConfirmDialog && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-[#16171B] border-2 border-[#C9EB3E] p-8 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-[#C9EB3E] text-2xl font-ShareTechMono mb-4">
              Confirm Submission
            </h3>
            <p className="text-white text-lg mb-6 font-ShareTechMono">
              You won't be able to edit your responses after this. Are you sure
              you want to submit?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelSubmit}
                className="px-6 py-2 bg-transparent border-2 border-white text-white font-ShareTechMono hover:bg-white hover:text-black transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-6 py-2 bg-[#C9EB3E] text-black font-ShareTechMono hover:bg-[#a8c932] transition-colors"
                type="button"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {showUnsavedDialog && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-[#16171B] border-2 border-[#C9EB3E] p-8 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-[#C9EB3E] text-2xl font-ShareTechMono mb-4">
              Unsaved Changes
            </h3>
            <p className="text-white text-lg mb-6 font-ShareTechMono">
              You have unsaved changes. Do you want to proceed without saving?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelQuestionChange}
                className="px-6 py-2 bg-transparent border-2 border-white text-white font-ShareTechMono hover:bg-white hover:text-black transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmQuestionChange}
                className="px-6 py-2 bg-[#C9EB3E] text-black font-ShareTechMono hover:bg-[#a8c932] transition-colors"
                type="button"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
      {subjectiveQuestions.length === 0 ? (
        <div className="text-white text-lg text-center py-8">
          No subjective questions available for this round.
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:space-x-8 min-h-[70vh]">
          <div className="w-full md:w-1/3">
            <QuestionList
              questions={questionsForList}
              onQuestionSelect={handleQuestionSelect}
              activeQuestionId={activeQuestionId}
              responses={savedResponses}
              currentResponses={effectiveResponses}
              questionsWithUnsavedEdits={questionsWithUnsavedEdits}
            />
          </div>
          <div className="w-full md:w-2/3 flex flex-row max-h-screen">
            {activeQuestion ? (
              <div className="w-full flex flex-col space-y-3">
                <div className="">
                  <QuestionBox
                    subject={activeQuestion.helpText || "CC Question"}
                    body={activeQuestion.question}
                  />
                </div>
                <div className="flex-1 min-h-[300px] sm:min-h-[420px]">
                  <AnswerBox
                    key={activeQuestion.id}
                    subject="Answer"
                    body={currentResponse}
                    language={selectedLanguage}
                    onLanguageChange={setSelectedLanguage}
                    onChange={(value) =>
                      activeQuestionId &&
                      handleResponseChange(activeQuestionId, value)
                    }
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    label={submitting ? "Submitting..." : "Submit Answer"}
                    onClick={handleSubmit}
                  />
                  <Button
                    label={
                      submittingForm ? "Submitting Form..." : "Submit Form"
                    }
                    onClick={handleSubmitForm}
                  />
                </div>
              </div>
            ) : (
              <div className="text-white text-lg">
                Select a question to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
