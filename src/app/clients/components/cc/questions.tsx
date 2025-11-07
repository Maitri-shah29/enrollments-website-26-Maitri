"use client";
import type { Prisma } from "@prisma/client";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import saveFormResponse from "@/app/actions/save-form-response";
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
}>;

type QuestionsProps = {
  roundUser?: RoundUserExtended;
  loading?: boolean;
  error?: string | null;
  responses?: Record<string, string>; // lifted state from parent
  setResponses?: React.Dispatch<React.SetStateAction<Record<string, string>>>; // setter from parent
};

const Questions = ({
  roundUser,
  loading = false,
  error = null,
  responses,
  setResponses,
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
  const [selectedLanguage, setSelectedLanguage] = useState<string>("plaintext");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (
      !roundUser ||
      !roundUser.round ||
      !Array.isArray(roundUser.round.Question)
    )
      return;
    const subjectiveQuestions = roundUser.round.Question.filter(
      (question) => question.type === "stq" || question.type === "ltq",
    );
    if (subjectiveQuestions.length > 0 && !activeQuestionId) {
      setActiveQuestionId(subjectiveQuestions[0].id);
    }
  }, [roundUser, activeQuestionId]);

  const handleQuestionSelect = (questionId: string) => {
    setActiveQuestionId(questionId);
  };

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
        if (err instanceof Error) {
          console.error("Auto-save error details:", err.message);
        }
      }
    },
    [roundUser?.formSubmission?.id],
  );

  const handleResponseChange = (questionId: string, response: string) => {
    updateResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      autoSaveResponse(questionId, response).catch((err) => {
        // Extra error handling layer
        console.error("Debounced auto-save error:", err);
      });
    }, 5000);
  };

  // Cleanup timer on unmount
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
                <div className="flex justify-end">
                  <Button
                    label={submitting ? "Submitting..." : "Submit"}
                    onClick={handleSubmit}
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
