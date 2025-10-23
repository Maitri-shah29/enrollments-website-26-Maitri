"use client";

import type { Domain } from "@prisma/client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { type ValidationRuleInput, validateAnswer } from "@/lib/validation";
import createFormSubmission from "../actions/create-form-submission";
import ensureRoundUser from "../actions/ensure-round-user";
import fetchRound from "../actions/fetch-round-details";
import getRoundQuestions from "../actions/get-round-questions";
import saveFormResponse from "../actions/save-form-response";
import About from "./components/management/about";
import Instructions from "./components/management/instructions";
import WhatWeDo from "./components/management/whatwedo";

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

// ----- Main Page -----
export default function Management() {
  const [activeSection, setActiveSection] = useState("About");
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

  // Function to render content dynamically
  const renderContent = () => {
    switch (activeSection) {
      case "About":
        return <About />;
      case "What we do":
        return <WhatWeDo />;
      case "Instructions":
        return <Instructions />;
      case "Round 1":
        return (
          <div className="relative bg-white backdrop-blur-md rounded-2xl min-w-[90%] h-[90%] shadow-lg overflow-y-auto opacity-[70%]">
            {/* Simple header bar for consistency */}
            <div className="h-13 flex items-center pl-5 text-2xl font-semibold text-[#666363] shadow-[0px_0px_5px_4px_rgb(0,0,0,0.1)] w-full bg-[#D0D0D0]">
              Round 1 · Management
            </div>

            <div className="p-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-black text-center mb-8">
                Questions
              </h1>

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
      default:
        return <About />;
    }
  };

  return (
    <div
      className="min-h-full flex flex-row bg-cover bg-center bg-no-repeat w-full"
      style={{ backgroundImage: "url('/images/red-pattern.jpg')" }}
    >
      {/* Sidebar */}
      <aside className="flex flex-col min-h-full w-[20vw] p-8 text-white">
        <Image
          src="/acmviticon.svg"
          alt="ACM VIT icon"
          width={180}
          height={180}
          className="mb-8"
        />

        <nav className="flex flex-col space-y-4 text-lg">
          {["About", "What we do", "Instructions", "Round 1"].map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`rounded-4xl px-6 py-2 text-left font-medium transition ${
                activeSection === section
                  ? "bg-white/50 text-white drop-shadow-lg/50"
                  : "hover:text-gray-200 hover:bg-white/25 text-white"
              }`}
            >
              {section}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-10 w-full min-h-fit">
        {renderContent()}
      </main>
    </div>
  );
}
