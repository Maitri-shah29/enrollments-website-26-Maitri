"use client";
import { Reply } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { QuestionPayload } from "@/lib/validation";
import Header from "./header";

interface Props {
  question: QuestionPayload;
  answer: string;
  error?: string;
  successMessage?: string;
  onChangeAnswer: (qid: string, value: string) => void;
  onSubmitAnswer: (q: QuestionPayload) => Promise<void>;
  goBack?: () => void;
}

export default function Question({
  question,
  answer,
  error,
  successMessage,
  onChangeAnswer,
  onSubmitAnswer,
  goBack,
}: Props) {
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
    <div className="relative bg-white opacity-[70%] backdrop-blur-md rounded-2xl w-[90%] h-[90%] shadow-lg overflow-hidden">
      <Header onClick={goBack} />
      <div className="p-10 overflow-y-auto h-full ">
        {/* Email Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Image src="/profile-icon.svg" alt="User" width={50} height={50} />
            <div>
              <p className="text-black font-medium">Mgmt</p>
              <p className="text-sm text-gray-700">
                &lt;loremipsum@gmail.com&gt;
              </p>
              <p className="text-sm text-gray-700">to me ▾</p>
            </div>
          </div>
        </div>

        <p
          className="break-words overflow-wrap-anywhere text-black"
          style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
        >
          {question.question}
        </p>
        {question.helpText && (
          <p className="text-sm text-gray-600 mt-2">{question.helpText}</p>
        )}

        {/* Answer Box */}
        <div className="bg-[#D9D9D9] mt-6 mb-6 rounded-2xl p-5 space-y-3">
          <div className="flex items-center text-sm text-gray-700 space-x-2">
            <Reply size={16} />
            <p>
              mgmt(ew-management@acm.org) -{" "}
              <span className="text-gray-500 italic">Saved draft</span>
            </p>
          </div>
          <div className="max-h-[325px] overflow-y-auto">
            <textarea
              value={answer}
              onChange={(e) => onChangeAnswer(question.id, e.target.value)}
              style={{
                wordBreak: "break-word",
                overflowWrap: "anywhere",
                overflowY: "hidden",
              }}
              placeholder="Type your answer here..."
              className="text-black w-full min-h-20 outline-none resize-none bg-transparent selection:bg-[#AA302E] selection:text-white"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          {successMessage && (
            <p className="text-green-600 text-sm mt-2">{successMessage}</p>
          )}

          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
              className="px-5 py-1 rounded-full bg-[#AD3232CC] text-white hover:bg-[#8B2828] disabled:bg-gray-400"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
