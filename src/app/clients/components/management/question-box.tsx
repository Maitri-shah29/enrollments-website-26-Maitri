"use client";
import type { Domain } from "@prisma/client";
import { Reply } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import createFormSubmission from "@/app/actions/create-form-submission";
import ensureRoundUser from "@/app/actions/ensure-round-user";
import fetchRound from "@/app/actions/fetch-round-details";
import getRoundQuestions from "@/app/actions/get-round-questions";
import saveFormResponse from "@/app/actions/save-form-response";
import type { QuestionPayload } from "@/lib/validation";
import { validateAnswer } from "@/lib/validation";
import Header from "./header";

type Props = {
  id: string;
};

export default function QuestionBox({ id }: Props) {
  const [question, setQuestion] = useState<QuestionPayload>();
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [formId, setFormId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const domain: Domain = "management";
        const rounds = await fetchRound(domain);
        if (!Array.isArray(rounds) || rounds.length === 0) return;

        const r = rounds[0];
        const qres = await getRoundQuestions(r.id);
        const qs = qres?.questions ?? [];
        const found = qs.find((q: any) => q.id === id);
        setQuestion(found);

        const ensureRes = await ensureRoundUser(r.id);
        if (!("error" in ensureRes)) {
          const createRes = await createFormSubmission(r.id);

          if ("formSubmission" in createRes)
            setFormId(createRes.formSubmission?.id ?? null);
        }
      } catch (err) {
        console.error("Failed to load question", err);
      }
    };
    load();
  }, [id]);

  async function handleSave() {
    if (!question) return;
    const vres = validateAnswer(answer, question.validators || []);
    if (!vres.valid) {
      setError(vres.error || "Invalid value");
      return;
    }
    if (!formId) {
      setError("Form not initialized");
      return;
    }

    try {
      await saveFormResponse(formId, question.id, answer);
      setError("");
      alert("Answer saved!");
    } catch (err) {
      console.warn("Failed to save", err);
      setError("Failed to save. Try again.");
    }
  }

  return (
    <div className="relative bg-white opacity-[70%] backdrop-blur-md rounded-2xl w-[90%] h-full shadow-lg overflow-y-auto">
      <Header />
      <div className="p-10">
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
          className="text-black break-words overflow-wrap-anywhere"
          style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
        >
          {question?.question}
        </p>

        {/* Answer Box */}
        <div className="bg-[#D9D9D9] rounded-2xl p-5 space-y-3">
          <div className="flex items-center text-sm text-gray-700 space-x-2">
            <Reply size={16} />
            <p>
              mgmt(ew-management@acm.org) -{" "}
              <span className="text-gray-500 italic">Saved draft</span>
            </p>
          </div>
          <textarea
            ref={inputRef}
            className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-gray-500 text-black"
            rows={6}
            placeholder="type your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!answer.trim()}
            className="px-4 py-2 mt-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
