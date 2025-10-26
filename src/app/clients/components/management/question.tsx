"use client";

import Image from "next/image";
import { useState } from "react";
import type { QuestionPayload } from "@/lib/validation";

interface Props {
  question: QuestionPayload;
  answer: string;
  error?: string;
  onChangeAnswer: (qid: string, value: string) => void;
  onSubmitAnswer: (q: QuestionPayload) => Promise<void>;
  goBack?: () => void;
}

export const Question = ({
  question,
  answer,
  error,
  onChangeAnswer,
  onSubmitAnswer,
  goBack,
}: Props) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmitAnswer(question);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative bg-white opacity-[70%] rounded-2xl min-w-[90%] h-[90%] shadow-lg flex flex-col overflow-hidden">
      <div className="relative h-14 flex items-center pl-5 text-2xl font-semibold text-black shadow-sm w-full bg-[#D0B5B5] rounded-t-2xl flex-shrink-0">
        <button
          type="button"
          onClick={goBack}
          className="absolute left-4 text-black hover:opacity-70 z-10 pl-3 pt-1"
        >
          <Image src="/back-arrow.svg" alt="Back" width={20} height={15} />
        </button>
      </div>

      <div className="flex items-center justify-between px-6 pt-4 pb-4 flex-shrink-0 overflow-hidden">
        <div className="flex items-center space-x-4 min-w-0 flex-1 overflow-hidden">
          <Image
            src="/profile-icon.svg"
            alt="User"
            className="flex-shrink-0 rounded-full"
            width={48}
            height={48}
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="break-words overflow-hidden">
              <span className="text-black font-semibold">Mgmt </span>
              <span className="text-black text-sm break-all">
                &lt;loremipsum@gmail.com&gt;
              </span>
            </div>
            <p className="text-sm text-black">to me ▾</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4 text-black text-base flex-shrink-0 overflow-hidden leading-relaxed">
        <p
          className="break-words overflow-wrap-anywhere"
          style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
        >
          {question.question}
        </p>
        {question.helpText && (
          <p className="text-sm text-gray-600 mt-2">{question.helpText}</p>
        )}
      </div>

      <div className="flex justify-center flex-1 px-6 pb-6 min-h-0 overflow-hidden">
        <div className="bg-[#D0B5B5] w-full rounded-2xl text-lg flex flex-col overflow-hidden">
          <div className="px-6 pt-4 pb-2 flex-shrink-0 overflow-hidden">
            <div className="flex items-center text-black text-sm overflow-hidden">
              <Image
                src="/back.svg"
                alt="Reply"
                width={16}
                height={16}
                className="mr-2 flex-shrink-0"
              />
              <span
                className="font-medium overflow-hidden break-all"
                style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
              >
                mgmt(ew-management@acm.org)
              </span>
              <span className="text-gray-600 ml-2 flex-shrink-0 whitespace-nowrap">
                - Saved draft
              </span>
            </div>
          </div>

          <div className="flex-1 px-6 flex flex-col min-h-0 overflow-hidden">
            <textarea
              value={answer}
              onChange={(e) => onChangeAnswer(question.id, e.target.value)}
              className="w-full flex-1 p-0 bg-transparent text-black text-base resize-none outline-none border-none overflow-auto leading-relaxed"
              style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
              placeholder="Type your answer here..."
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex justify-end px-6 pb-4 flex-shrink-0">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-8 py-2.5 rounded-full text-white font-medium shadow-md transition ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#C87B7B] hover:bg-[#B86B6B]"
              }`}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
