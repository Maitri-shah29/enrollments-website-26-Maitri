"use client";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
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
  savedAnswers?: Record<string, string>;
  onSaveAnswer?: (key: string, value: string) => void;
  hasUnsavedChangesRef?: React.MutableRefObject<boolean>;
  onMarkUnsaved?: (key: string) => void;
};

export interface QuestionsRef {
  trigger: () => Promise<void>;
}

const Questions = forwardRef<QuestionsRef, Props>((props, ref) => {
  const {
    activeRoundFolder,
    activeQuestion,
    roundUser,
    answers,
    onChangeAnswer,
    onSubmit,
    savedAnswers = {},
    onSaveAnswer,
    hasUnsavedChangesRef,
    onMarkUnsaved,
  } = props;
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success",
  );

  const questionNumber = Number.parseInt(
    activeQuestion.replace("question", ""),
    10,
  );
  const questionKey = `${activeRoundFolder}-${activeQuestion}`;

  const folderQuestions =
    roundUser?.round?.Question?.filter(
      (q) => q.varName === activeRoundFolder,
    ) || [];

  const sortedQuestions = [...folderQuestions].sort(
    (a, b) => a.serial - b.serial,
  );
  const currentQuestion = sortedQuestions[questionNumber - 1];

  const handleSubmit = useCallback(async () => {
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

      // Update saved answers
      if (onSaveAnswer) {
        onSaveAnswer(currentQuestion.id, currentResponse);
      }

      // Clear unsaved changes flag
      if (hasUnsavedChangesRef) {
        hasUnsavedChangesRef.current = false;
      }

      setNotificationType("success");
      setNotification("Answer saved successfully!");
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
  }, [
    currentQuestion,
    roundUser,
    answers,
    questionKey,
    onSaveAnswer,
    hasUnsavedChangesRef,
    onSubmit,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      trigger: handleSubmit,
    }),
    [handleSubmit],
  );

  if (
    !roundUser ||
    !roundUser.round ||
    !Array.isArray(roundUser.round.Question)
  ) {
    return (
      <div className="text-[#b65cad] text-2xl font-semibold text-center">
        <h1>Loading Round Data...</h1>
        <p className="mt-4 text-lg text-white">
          Please wait while we fetch your questions.
        </p>
      </div>
    );
  }

  if (!activeRoundFolder) {
    return (
      <div className="text-[#b65cad] text-2xl font-semibold text-center">
        <h1>Round 1 Overview</h1>
        <p className="mt-4 text-lg text-white">
          Choose a folder from the sidebar to get started.
        </p>
      </div>
    );
  }

  if (folderQuestions.length === 0) {
    return (
      <div className="text-[#b65cad] text-2xl font-semibold text-center">
        <h1>{activeRoundFolder}</h1>
        <p className="mt-4 text-lg text-white">
          No questions available for this area of interest.
        </p>
      </div>
    );
  }

  if (!activeQuestion) {
    return (
      <div className="text-[#b65cad] text-2xl font-semibold text-center">
        <h1>{activeRoundFolder}</h1>
        <p className="mt-4 text-lg text-white">
          Select a question to get started with {activeRoundFolder}.
        </p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-[#b65cad] text-2xl font-semibold text-center">
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

  return (
    <div className="w-full h-full relative">
      {notification && (
        <div
          className={`fixed top-30 right-8 px-4 py-2 font-jetbrains shadow-lg z-50 text-white border ${
            notificationType === "success"
              ? "bg-[#08111D] border-[#b65cad]"
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
        <div className="text-[#b65cad] font-jetbrains text-sm mb-2">
          q{questionNumber}:{questionTitle}
        </div>
        <div className="text-[#b65cad] font-jetbrains text-sm leading-relaxed mb-4">
          {questionDescription.split("\n").map((line, idx) => (
            <div key={line || idx} className="flex items-start gap-2 px-18">
              <span className="text-[#b65cad] select-none">{">"}</span>
              <span className="pl-3">{line}</span>
            </div>
          ))}
        </div>
        <div className="text-[#b65cad] font-jetbrains text-sm mb-2">
          q{questionNumber}:ans
        </div>

        <div className="mb-8 px-18 flex items-start gap-2">
          <span className="text-[#b65cad] font-jetbrains text-sm select-none">
            {">"}
          </span>
          <textarea
            style={{ height: "calc(7 * 1.25rem)" }}
            className="flex-1 bg-transparent text-[#f0e6ff] selection:bg-[#b65cad] selection:text-white font-jetbrains text-sm leading-5 pl-3 resize-none focus:outline-none focus:border-white transition-colors [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-[#b65cad]"
            placeholder="Type your answer here..."
            value={answers[questionKey] || ""}
            onChange={(e) => {
              const text = e.target.value;

              if (text.length > 1500) return;

              onChangeAnswer(questionKey, e.target.value);

              const savedValue = savedAnswers[currentQuestion.id];
              const isDifferent =
                savedValue !== undefined && savedValue !== e.target.value;
              const newHasUnsaved =
                isDifferent ||
                (savedValue === undefined && e.target.value.trim().length > 0);
              if (hasUnsavedChangesRef) {
                hasUnsavedChangesRef.current = newHasUnsaved;
              }

              // Mark as unsaved if editing a saved question
              if (isDifferent && onMarkUnsaved) {
                onMarkUnsaved(questionKey);
              }
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
        <p className="text-xs text-gray-500 mt-1">
          {1500 - (answers[questionKey]?.length ?? 0)} characters left
        </p>

        <div className="flex justify-end">
          <TechButton
            type="button"
            className="bg-transparent border text-white border-[#b65cad] hover:bg-[#b65cad] px-10 py-2 mt-6 font-jetbrains text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!(answers[questionKey] || "").trim() || submitting}
          >
            {submitting ? "saving..." : "save"}
          </TechButton>
        </div>
      </div>
    </div>
  );
});

Questions.displayName = "Questions";

export default Questions;
