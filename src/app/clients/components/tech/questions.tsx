"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import saveFormResponse from "@/app/actions/save-form-response";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import { asciiArt } from "./ascii-art";
import TechButton from "./button";

type Props = {
  activeRoundFolder: string;
  activeQuestion: string;
  roundUser?: RoundUserExtended;
  answers: Record<string, string>;
  onChangeAnswer: (key: string, value: string) => void;
  onSubmit: (key: string) => void;
};

export default function Questions({
  activeRoundFolder,
  activeQuestion,
  roundUser,
  answers,
  onChangeAnswer,
  onSubmit,
}: Props) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success",
  );
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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

  const handleResponseChange = (
    questionKey: string,
    questionId: string,
    response: string,
  ) => {
    onChangeAnswer(questionKey, response);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      autoSaveResponse(questionId, response).catch((err) => {
        console.error("Debounced auto-save error:", err);
      });
    }, 3000);
  };

  if (
    !roundUser ||
    !roundUser.round ||
    !Array.isArray(roundUser.round.Question)
  ) {
    return (
      <div className="text-[#993C7A] text-2xl font-semibold text-center">
        <h1>Loading Round Data...</h1>
        <p className="mt-4 text-lg text-white">
          Please wait while we fetch your questions.
        </p>
      </div>
    );
  }

  if (!activeRoundFolder) {
    return (
      <div className="text-[#993C7A] text-2xl font-semibold text-center">
        <h1>Round 1 Overview</h1>
        <p className="mt-4 text-lg text-white">
          Choose a folder from the sidebar to get started.
        </p>
      </div>
    );
  }

  const folderQuestions = roundUser.round.Question.filter(
    (q) => q.varName === activeRoundFolder,
  );

  if (folderQuestions.length === 0) {
    return (
      <div className="text-[#993C7A] text-2xl font-semibold text-center">
        <h1>{activeRoundFolder}</h1>
        <p className="mt-4 text-lg text-white">
          No questions available for this area of interest.
        </p>
      </div>
    );
  }

  if (!activeQuestion) {
    return (
      <div className="text-[#993C7A] text-2xl font-semibold text-center">
        <h1>{activeRoundFolder}</h1>
        <p className="mt-4 text-lg text-white">
          Select a question to get started with {activeRoundFolder}.
        </p>
      </div>
    );
  }

  const questionNumber = Number.parseInt(
    activeQuestion.replace("question", ""),
    10,
  );
  const questionKey = `${activeRoundFolder}-${activeQuestion}`;

  const sortedQuestions = [...folderQuestions].sort(
    (a, b) => a.serial - b.serial,
  );
  const currentQuestion = sortedQuestions[questionNumber - 1];

  if (!currentQuestion) {
    return (
      <div className="text-[#993C7A] text-2xl font-semibold text-center">
        <h1>Question Not Found</h1>
        <p className="mt-4 text-lg text-white">
          The selected question does not exist for {activeRoundFolder}.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Question #{questionNumber} not found in {folderQuestions.length}{" "}
          available questions.
        </p>
      </div>
    );
  }

  const questionTitle =
    currentQuestion.helpText || `Question ${questionNumber}`;
  const questionDescription =
    currentQuestion.question || "No description available for this question.";

  const handleSubmit = async () => {
    if (!currentQuestion || !roundUser?.formSubmission?.id) {
      setNotificationType("error");
      setNotification("No active question or form submission found");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const currentResponse = answers[questionKey] || "";
    if (!currentResponse.trim()) {
      setNotificationType("error");
      setNotification("Please provide an answer before submitting");
      setTimeout(() => setNotification(null), 3000);
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
      onSubmit(questionKey);

      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error("Submit error:", err);
      setNotificationType("error");
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save response";
      setNotification(errorMsg);
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full relative">
      {notification && (
        <div
          className={`fixed top-30 right-8 px-4 py-2 font-jetbrains shadow-lg z-50 text-white border ${
            notificationType === "success"
              ? "bg-[#08111D] border-[#993C7A]"
              : "bg-[#08111D] border-red-500"
          }`}
        >
          {notification}
        </div>
      )}

      <pre className="text-white font-mono text-sm leading-tight mb-8">
        {asciiArt[questionNumber] || `Question ${questionNumber}`}
      </pre>

      <div className="mt-8">
        <div className="text-[#993C7A] font-jetbrains text-sm mb-2">
          q{questionNumber}:{questionTitle}
        </div>
        <div className="text-[#993C7A] font-jetbrains text-sm leading-relaxed mb-4">
          {questionDescription.split("\n").map((line, idx) => (
            <div key={line || idx} className="flex items-start gap-2 px-18">
              <span className="text-[#993C7A] select-none">{">"}</span>
              <span className="pl-3">{line}</span>
            </div>
          ))}
        </div>
        <div className="text-[#993C7A] font-jetbrains text-sm mb-2">
          q{questionNumber}:ans
        </div>

        <div className="mb-8 px-18 flex items-start gap-2">
          <span className="text-[#993C7A] font-jetbrains text-sm select-none">
            {">"}
          </span>
          <textarea
            style={{ height: "calc(7 * 1.25rem)" }}
            className="flex-1 bg-transparent text-[#E097CE] selection:bg-[#993C7A] selection:text-white font-jetbrains text-sm leading-5 pl-3 resize-none focus:outline-none focus:border-white transition-colors [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-[#993C7A]"
            placeholder="Type your answer here..."
            value={answers[questionKey] || ""}
            onChange={(e) => {
              handleResponseChange(
                questionKey,
                currentQuestion.id,
                e.target.value,
              );
            }}
            onWheel={(e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const lineHeight = 20;
              const currentScroll = target.scrollTop;
              const direction = e.deltaY > 0 ? 1 : -1;
              const currentLine = Math.round(currentScroll / lineHeight);
              const nextLine = currentLine + direction;
              target.scrollTop = nextLine * lineHeight;
            }}
          />
        </div>

        <div className="flex justify-end">
          <TechButton
            type="button"
            className="bg-transparent border border-[#993C7A] hover:bg-[#993C7A] px-10 py-2 mt-6 font-jetbrains text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!(answers[questionKey] || "").trim() || submitting}
          >
            {submitting ? "submitting..." : "submit"}
          </TechButton>
        </div>
      </div>
    </div>
  );
}
