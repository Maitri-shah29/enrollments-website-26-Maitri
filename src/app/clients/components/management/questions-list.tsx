"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import revalidateHome from "@/app/actions/revalidate";
import type { QuestionPayload } from "@/lib/validation";
import Header from "./header";
import Question from "./question";

interface QuestionsProps {
  questions: QuestionPayload[];
  answers: Record<string, string>;
  searchInput: string;
  errors: Record<string, string>;
  successMessages: Record<string, string>;
  onChangeAnswer: (qid: string, value: string) => void;
  onSubmitAnswer: (q: QuestionPayload) => Promise<void>;
  wallpaper: string; // ✅ Add this
}

export default function QuestionsList({
  questions,
  answers,
  searchInput,
  errors,
  successMessages,
  onChangeAnswer,
  onSubmitAnswer,
  wallpaper, // ✅ You forgot to include this!
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
        successMessage={successMessages[questionData.id]}
        onChangeAnswer={onChangeAnswer}
        onSubmitAnswer={onSubmitAnswer}
        goBack={() => setActiveIndex(null)}
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
    <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-[100%] h-[90%] shadow-lg flex flex-col overflow-auto">
      <Header />
      <button
        type="button"
        onClick={handleRevalidate}
        disabled={revalidating}
        className={`absolute left-14 top-1 rounded-lg p-1 transition ${
          revalidating ? "bg-gray-400 cursor-not-allowed" : "hover:bg-gray-400"
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

      <div className="p-2 h-full w-full overflow-y-auto">
        <div className="space-y-1">
          {questions.map(
            (q, index) =>
              (searchInput.trim() === "" ||
                q.question
                  .toLowerCase()
                  .includes(searchInput.toLowerCase())) && (
                <label
                  key={q.id}
                  onClick={() => handleClick(index)}
                  className="flex items-start gap-3 w-full cursor-pointer hover:bg-gray-100  rounded-md px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={visited[index] || false}
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
                    {q.question.length > 50
                      ? `${q.question.slice(0, 50)}...`
                      : q.question}
                  </span>
                </label>
              ),
          )}
        </div>
      </div>
    </div>
  );
}
