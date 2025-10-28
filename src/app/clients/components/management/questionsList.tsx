"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import revalidateHome from "@/app/actions/revalidate";
import type { QuestionPayload } from "@/lib/validation";
import { Question } from "./question";

interface QuestionsProps {
  questions: QuestionPayload[];
  answers: Record<string, string>;
  errors: Record<string, string>;
  onChangeAnswer: (qid: string, value: string) => void;
  onSubmitAnswer: (q: QuestionPayload) => Promise<void>;
}

export default function QuestionsList({
  questions,
  answers,
  errors,
  onChangeAnswer,
  onSubmitAnswer,
}: QuestionsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [visited, setVisited] = useState<boolean[]>([]);
  const [revalidating, setRevalidating] = useState(false);

  useEffect(() => {
    const initial = Array(questions.length).fill(false);
    setVisited(initial);
  }, [questions.length]);

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
        onChangeAnswer={onChangeAnswer}
        onSubmitAnswer={onSubmitAnswer}
        goBack={() => setActiveIndex(null)}
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
    <div className="relative bg-white opacity-[70%] backdrop-blur-md rounded-2xl w-[90%] h-[90%] shadow-lg flex flex-col overflow-hidden">
      <div className="bg-[#D0D0D0] px-6 py-4 flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          className="p-2 hover:bg-gray-300 rounded-lg transition"
          aria-label="Back"
        >
          <Image src="/back-arrow.svg" alt="Back" width={24} height={24} />
        </button>
        <button
          type="button"
          onClick={handleRevalidate}
          disabled={revalidating}
          className={`p-2 rounded-lg transition ${
            revalidating
              ? "bg-gray-400 cursor-not-allowed"
              : "hover:bg-gray-300"
          }`}
          aria-label="Revalidate"
        >
          <Image
            src="/retry.svg"
            alt="Revalidate"
            width={24}
            height={24}
            className={revalidating ? "animate-spin" : ""}
          />
        </button>
        {revalidating && (
          <span className="text-sm text-gray-600">Revalidating...</span>
        )}
      </div>
      <div className="flex-1 p-10 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="text-black leading-relaxed space-y-4 text-base">
          <div className="space-y-4">
            {questions.map((q, index) => (
              <button
                key={`question-${q.id}-${index}`}
                type="button"
                onClick={() => handleClick(index)}
                className="w-full cursor-pointer hover:bg-gray-100 rounded-lg p-4 transition flex items-start gap-4 text-left"
              >
                <div className="relative w-6 h-6 min-w-[24px] min-h-[24px] mt-1 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={visited[index] || false}
                    readOnly
                    tabIndex={-1}
                    className="w-full h-full cursor-pointer rounded-lg border-2 border-gray-400 accent-blue-600 pointer-events-none"
                  />
                </div>
                <span
                  className="font-medium flex-1 text-gray-700"
                  style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                >
                  {index + 1}. {q.question}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
