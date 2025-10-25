"use client";
import type { Domain } from "@prisma/client";
import { useEffect, useMemo, useRef, useState } from "react";
import createFormSubmission from "@/app/actions/create-form-submission";
import ensureRoundUser from "@/app/actions/ensure-round-user";
import fetchRound from "@/app/actions/fetch-round-details";
import getRoundQuestions from "@/app/actions/get-round-questions";
import saveFormResponse from "@/app/actions/save-form-response";
import { type ValidationRuleInput, validateAnswer } from "@/lib/validation";
import Header from "./header";

type QuestionPayload = {
  id: string;
  serial: number;
  question: string;
  helpText?: string | null;
  varName?: string | null;
  type?: string | null;
  options?: unknown;
  validators: ValidationRuleInput[];
};

type QuestionListProps = {
  activeSection: string;
};

export default function QuestionList({ activeSection }: QuestionListProps) {
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [roundInitDone, setRoundInitDone] = useState(false);
  const [_roundId, setRoundId] = useState<string | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // key: questionId
  const [errors, setErrors] = useState<Record<string, string>>({}); // key: questionId
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const answersByVar = useMemo(() => {
    const map: Record<string, string> = {};
    for (const q of questions) {
      const name = q.varName ?? undefined;
      if (name) {
        map[name] = answers[q.id] ?? "";
      }
    }
    return map;
  }, [questions, answers]);

  // Load Management Round 1 data when the section is opened the first time
  useEffect(() => {
    const load = async () => {
      if (roundInitDone || loading || activeSection !== "Round 1") return;
      setLoading(true);
      setInitError(null);
      setFormWarning(null);
      try {
        const domain: Domain = "management";
        const rounds = await fetchRound(domain);
        if (!Array.isArray(rounds)) {
          setInitError("Please sign in to view Management rounds.");
          return;
        }
        if (rounds.length === 0) {
          setInitError("No active rounds found for Management.");
          return;
        }
        const r = rounds[0];
        setRoundId(r.id);

        const qres = await getRoundQuestions(r.id);
        const qs = (qres?.questions ?? []).sort(
          (a, b) => (a.serial ?? 0) - (b.serial ?? 0),
        ) as QuestionPayload[];
        setQuestions(qs);
        const initialAnswers: Record<string, string> = {};
        qs.forEach((q) => {
          initialAnswers[q.id] = "";
        });
        setAnswers(initialAnswers);

        // Ensure the current user is mapped to this round so form submission can be created
        const ensureRes = await ensureRoundUser(r.id);
        if ("error" in ensureRes && ensureRes.error === "Not logged in") {
          setInitError("Please sign in to answer questions.");
          return;
        }
        if ("error" in ensureRes && ensureRes.error) {
          // If we cannot ensure mapping, allow viewing but warn about saving
          setFormWarning(
            "Could not link you to this round automatically; you can view questions but cannot save answers.",
          );
        }

        const createRes = await createFormSubmission(r.id);
        // Accept both freshly created and already existing submission
        const fid =
          createRes && "formSubmission" in createRes
            ? createRes.formSubmission?.id
            : undefined;
        if (fid) setFormId(fid);
        else if (
          createRes &&
          "error" in createRes &&
          createRes.error === "Not logged in"
        ) {
          setInitError("Please sign in to answer questions.");
        } else if (
          createRes &&
          "error" in createRes &&
          createRes.error === "User does not exist for this round"
        ) {
          setFormWarning(
            "You're not registered for this round yet; you can view questions but cannot save answers.",
          );
        }
      } catch (e) {
        console.error("[management] init load failed", e);
        setInitError("Failed to load round/questions. Try again later.");
      } finally {
        setLoading(false);
        setRoundInitDone(true);
      }
    };
    load();
  }, [activeSection, loading, roundInitDone]);

  function onChangeAnswer(qid: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
    if (errors[qid]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[qid];
        return next;
      });
    }
  }

  async function onSubmitAnswer(q: QuestionPayload) {
    const current = answers[q.id] ?? "";
    const vres = validateAnswer(current, q.validators, { answersByVar });
    if (!vres.valid) {
      setErrors((prev) => ({ ...prev, [q.id]: vres.error || "Invalid value" }));
      return;
    }
    if (!formId) {
      setErrors((prev) => ({ ...prev, [q.id]: "Form not initialized" }));
      return;
    }
    try {
      await saveFormResponse(formId, q.id, current);
      setAnswers((prev) => ({ ...prev, [q.id]: "" }));
      // focus next input
      const idx = questions.findIndex((qq) => qq.id === q.id);
      const next = questions[idx + 1]?.id;
      if (next) inputRefs.current[next]?.focus?.();
    } catch (err) {
      console.warn("[management] save failed", err);
      setErrors((prev) => ({ ...prev, [q.id]: "Failed to save. Try again." }));
    }
  }

  return (
    <div className="relative bg-white opacity-[70%] backdrop-blur-md rounded-2xl w-[90%] h-full shadow-lg overflow-y-auto">
      <Header />
      <div className="p-10">
        {loading && <p className="text-gray-700 text-center">Loading…</p>}
        {initError && (
          <p className="text-red-600 text-center" role="alert">
            {initError}
          </p>
        )}
        {formWarning && !initError && (
          <output className="text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 text-center block">
            {formWarning}
          </output>
        )}

        {!loading && !initError && questions.length === 0 && (
          <p className="text-gray-700 text-center">No questions.</p>
        )}

        <div className="space-y-8 max-w-3xl mx-auto">
          {questions.map((q) => (
            <section key={q.id} className="text-black">
              <h3 className="mb-3 font-semibold">
                Q{q.serial}. {q.question}
              </h3>
              <div className="relative">
                <input
                  ref={(el) => {
                    inputRefs.current[q.id] = el;
                  }}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => onChangeAnswer(q.id, e.target.value)}
                  className={`w-full p-4 pr-28 bg-white text-gray-900 shadow-sm border rounded-xl focus:ring-2 transition placeholder:text-gray-500 ${
                    errors[q.id]
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="type your answer..."
                />
                <button
                  type="button"
                  onClick={() => onSubmitAnswer(q)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 disabled:bg-gray-300"
                  disabled={!formId || !(answers[q.id] ?? "").trim()}
                >
                  Save
                </button>
              </div>
              {errors[q.id] && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {errors[q.id]}
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
