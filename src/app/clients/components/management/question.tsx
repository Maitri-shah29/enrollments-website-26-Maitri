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
  wallpaper: string;
}

const themeButtonClasses: Record<string, string> = {
  "big sur": "bg-[#AD3232] hover:bg-[#AD3232]/80",
  sequoia: "bg-[#2E4A7A] hover:bg-[#2E4A7A]/80",
  sonoma: "bg-[#005B23] hover:bg-[#005B23]/80",
};

export default function Question({
  question,
  answer,
  error,
  successMessage,
  onChangeAnswer,
  onSubmitAnswer,
  goBack,
  wallpaper,
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
    <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-full h-[90%] shadow-lg flex flex-col overflow-auto">
      <Header onClick={goBack} />

      <div className="flex flex-col p-10 h-full overflow-auto">
        {/* Email Header */}
        <div className="flex items-center space-x-3 mb-6">
          <Image src="/profile-icon.svg" alt="User" width={50} height={50} />
          <div>
            <p className="text-black font-medium">Mgmt</p>
            <p className="text-sm text-gray-700">
              &lt;management@acmvit.in&gt;
            </p>
            <p className="text-sm text-gray-700">to me ▾</p>
          </div>
        </div>

        {/* Question Text */}
        <div className="text-black">
          <p className="whitespace-pre-wrap break-normal">
            {question.question}
          </p>
          {question.helpText && (
            <p className="text-sm text-gray-600 mt-2">{question.helpText}</p>
          )}
        </div>

        <div className="bg-[#ececec] rounded-2xl p-5 shadow-lg mt-6 flex flex-col flex-1">
          {/* Reply label */}
          <div className="flex items-center text-sm text-gray-700 space-x-2 mb-3">
            <Reply size={16} />
            <p>
              mgmt(ew-management@acmvit.in) -{" "}
              <span className="text-gray-500 italic">Saved draft</span>
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <textarea
              value={answer}
              onChange={(e) => {
                const text = e.target.value;

                if (text.length > 1500) return;

                onChangeAnswer(question.id, e.target.value);
              }}
              style={{
                wordBreak: "break-word",
                overflowWrap: "anywhere",
                overflowY: "hidden",
              }}
              placeholder="Type your answer here..."
              className="text-black w-full h-full outline-none bg-transparent resize-none selection:bg-[#AA302E] selection:text-white"
            />
          </div>

          {/* Error + Success */}
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          {successMessage && (
            <p className="text-green-600 text-sm mt-2">{successMessage}</p>
          )}

          {/* Submit button */}
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
              className={`px-5 py-2 rounded-full text-white transition disabled:bg-gray-400 disabled:cursor-not-allowed ${
                !answer.trim() || submitting
                  ? "bg-gray-400"
                  : themeButtonClasses[wallpaper] ||
                    "bg-[#AD3232] hover:bg-[#AD3232]/80"
              }`}
            >
              {submitting ? "Saving..." : "Save Answer"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {1500 - answer.length} characters left
          </p>
        </div>
      </div>
    </div>
  );
}
