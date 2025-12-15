"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import revalidateHome from "@/app/actions/revalidate";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import type { QuestionPayload } from "@/lib/validation";
import Header from "./header";
import Question from "./question";

interface QuestionsProps {
  questions: QuestionPayload[];
  answers: Record<string, string>;
  savedAnswers?: Record<string, string>;
  searchInput: string;
  errors: Record<string, string>;
  successMessages: Record<string, string>;
  onChangeAnswer: (qid: string, value: string) => void;
  onSubmitAnswer: (q: QuestionPayload) => Promise<void>;
  wallpaper: string;
  onSubmitForm?: () => void;
  roundUser?: RoundUserExtended | null;
  submittingForm?: boolean;
  onBack?: () => void;
  onQuestionBackClick?: () => void;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
}

export default function QuestionsList({
  questions,
  answers,
  savedAnswers = {},
  searchInput,
  errors,
  successMessages,
  onChangeAnswer,
  onSubmitAnswer,
  wallpaper,
  onSubmitForm,
  roundUser,
  submittingForm,
  onBack,
  onQuestionBackClick,
  activeIndex,
  setActiveIndex,
}: QuestionsProps) {
  const [_visited, setVisited] = useState<boolean[]>([]);
  const [revalidating, setRevalidating] = useState(false);

  useEffect(() => {
    const initial = Array(questions.length).fill(false);
    setVisited(initial);
  }, [questions.length]);

  useEffect(() => {
    const handleProceed = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      const index = customEvent.detail.index;
      setVisited((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
      setActiveIndex(index);
    };

    window.addEventListener("proceedWithNavigation", handleProceed);
    return () =>
      window.removeEventListener("proceedWithNavigation", handleProceed);
  }, [setActiveIndex]);

  const handleRevalidate = async () => {
    setRevalidating(true);
    try {
      await revalidateHome();
    } catch (error) {
      console.error("Revalidation failed:", error);
      alert("Revalidation failed! Check console for details.");
    } finally {
      setRevalidating(false);
    }
  };

  if (activeIndex !== null) {
    const questionData = questions[activeIndex];
    return (
      <Question
        question={questionData}
        answer={answers[questionData.id] || ""}
        error={errors[questionData.id]}
        successMessage={successMessages[questionData.id]}
        onChangeAnswer={onChangeAnswer}
        onSubmitAnswer={onSubmitAnswer}
        goBack={onQuestionBackClick}
        wallpaper={wallpaper}
      />
    );
  }

  const handleClick = (index: number) => {
    setVisited((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    setActiveIndex(index);
  };

  return (
    <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-[100%] h-[90%] shadow-lg flex flex-col overflow-hidden">
      <Header onClick={onBack} />
      <div className="absolute left-14 top-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleRevalidate}
          disabled={revalidating}
          className={`rounded-lg p-1 transition ${
            revalidating
              ? "bg-gray-400 cursor-not-allowed"
              : "hover:bg-gray-400"
          }`}
          aria-label="Revalidate"
        >
          <Image
            src="/retry.svg"
            alt="Revalidate"
            width={18}
            height={18}
            className={revalidating ? "animate-spin" : ""}
          />
        </button>
        {revalidating && (
          <span className="text-sm text-gray-600">Revalidating...</span>
        )}
      </div>

      <div className="p-2 flex-1 w-full overflow-y-auto">
        <div className="space-y-1">
          {(() => {
            const filteredQuestions = questions.filter(
              (q) =>
                searchInput.trim() === "" ||
                q.question.toLowerCase().includes(searchInput.toLowerCase()),
            );

            if (filteredQuestions.length === 0 && searchInput.trim() !== "") {
              return (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <p className="text-lg font-medium">No questions found</p>
                  <p className="text-sm mt-1">
                    Try a different search term or clear the search bar
                  </p>
                </div>
              );
            }

            return questions.map(
              (q, index) =>
                (searchInput.trim() === "" ||
                  q.question
                    .toLowerCase()
                    .includes(searchInput.toLowerCase())) && (
                  <label
                    key={q.id}
                    onClick={() => handleClick(index)}
                    onKeyDown={(e) => e.key === "Enter" && handleClick(index)}
                    className="flex items-start gap-3 w-full cursor-pointer hover:bg-gray-100  rounded-md px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={!!savedAnswers[q.id]?.trim()}
                      tabIndex={-1}
                      className="flex-shrink-0 w-4 h-4 mt-0.5 checked:accent-gray-500 cursor-pointer overflow-hidden"
                      readOnly
                    />

                    <span
                      className="font-medium flex-1 text-gray-700"
                      style={{
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      }}
                    >
                      {index + 1}.{" "}
                      {q.question.length > 100
                        ? `${q.question.slice(0, 100)}...`
                        : q.question}
                    </span>
                  </label>
                ),
            );
          })()}
        </div>
      </div>

      {roundUser?.status === "pending" && onSubmitForm && (
        <div className="p-4 flex justify-end">
          <button
            type="button"
            onClick={onSubmitForm}
            disabled={submittingForm}
            className="px-5 py-2 rounded-full text-white font-medium transition disabled:bg-gray-400 disabled:cursor-not-allowed bg-gray-600 hover:bg-gray-500"
          >
            {submittingForm ? "Submitting..." : "Submit Form"}
          </button>
        </div>
      )}
    </div>
  );
}
