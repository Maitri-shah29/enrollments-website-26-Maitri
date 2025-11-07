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
};

const Questions = ({
  roundUser,
  loading = false,
  error = null,
}: QuestionsProps) => {
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success",
  );
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (roundUser?.formSubmission?.responses) {
      const initialResponses: Record<string, string> = {};
      roundUser.formSubmission.responses.forEach((response) => {
        if (response.response) {
          initialResponses[response.questionId] = response.response;
        }
      });
      setResponses(initialResponses);
    }
  }, [roundUser?.formSubmission?.responses]);

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
      }
    },
    [roundUser?.formSubmission?.id],
  );

  const handleResponseChange = (questionId: string, response: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for auto-save after 5 seconds
    debounceTimerRef.current = setTimeout(() => {
      autoSaveResponse(questionId, response);
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
    ? responses[activeQuestionId] || ""
    : "";

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

  return (
    <div className="flex flex-col space-y-6 min-h-full">
      {notification && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded shadow-lg z-50 text-white ${
            notificationType === "success" ? "bg-green-600" : "bg-red-600"
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
                    language="plaintext"
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
