"use client";

import type { Domain } from "@prisma/client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { QuestionPayload } from "@/lib/validation";
import { validateAnswer } from "@/lib/validation";
import fetchRound from "../actions/fetch-round-details";
import getRoundQuestions from "../actions/get-round-questions";
import About from "./components/management/about";
import Instructions from "./components/management/instructions";
import ManagementLanding from "./components/management/landing";
import QuestionsList from "./components/management/questionsList";
import WhatWeDo from "./components/management/whatwedo";

// ----- Main Page -----
export default function Management() {
  const [activeSection, setActiveSection] = useState("Landing");
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [roundInitDone, setRoundInitDone] = useState(false);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // key: questionId
  const [errors, setErrors] = useState<Record<string, string>>({}); // key: questionId

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
      try {
        const domain: Domain = "management";

        // Fetch rounds with better error handling
        const rounds = await fetchRound(domain);

        // Check if user is not logged in
        if (!Array.isArray(rounds)) {
          setInitError("Please sign in to view Management rounds.");
          setLoading(false);
          setRoundInitDone(true);
          return;
        }

        // Check if rounds exist
        if (rounds.length === 0) {
          setInitError("No active rounds found for Management.");
          setLoading(false);
          setRoundInitDone(true);
          return;
        }

        const r = rounds[0];
        setRoundId(r.id);

        // Fetch questions with error handling
        const qres = await getRoundQuestions(r.id);

        if (!qres || !qres.questions) {
          setInitError("Failed to load questions. Please try again.");
          setLoading(false);
          setRoundInitDone(true);
          return;
        }

        const qs = (qres.questions ?? []).sort(
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

        if (
          ensureRes &&
          "error" in ensureRes &&
          ensureRes.error === "Not logged in"
        ) {
          setInitError("Please sign in to answer questions.");
          setLoading(false);
          setRoundInitDone(true);
          return;
        }

        if (ensureRes && "error" in ensureRes && ensureRes.error) {
          // If we cannot ensure mapping, allow viewing but warn about saving
          setFormWarning(
            "Could not link you to this round automatically; you can view questions but cannot save answers.",
          );
        }

        // Create form submission
        const createRes = await createFormSubmission(r.id);

        // Accept both freshly created and already existing submission
        const fid =
          createRes && "formSubmission" in createRes
            ? createRes.formSubmission?.id
            : undefined;

        if (fid) {
          setFormId(fid);
        } else if (
          createRes &&
          "error" in createRes &&
          createRes.error === "Not logged in"
        ) {
          setInitError("Please sign in to answer questions.");
          setLoading(false);
          setRoundInitDone(true);
          return;
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
    setErrors((prev) => ({ ...prev, [q.id]: "Saving is disabled." }));
  }

  const handleGetStarted = () => {
    setActiveSection("About");
  };

  // Function to render content dynamically
  const renderActiveSection = () => {
    switch (activeSection) {
      case "Landing":
        return <ManagementLanding onGetStarted={handleGetStarted} />;
      case "About":
        return <About />;
      case "What we do":
        return <WhatWeDo />;
      case "Instructions":
        return <Instructions />;
      case "Round 1":
        if (loading) {
          return (
            <div className="text-center">
              <p className="text-gray-700">Loading round...</p>
            </div>
          );
        }
        if (initError) {
          return (
            <div className="text-center">
              <p className="text-red-600 font-semibold">{initError}</p>
            </div>
          );
        }
        return roundId && questions.length > 0 ? (
          <QuestionsList
            questions={questions}
            answers={answers}
            errors={errors}
            onChangeAnswer={onChangeAnswer}
            onSubmitAnswer={onSubmitAnswer}
          />
        ) : (
          <div className="text-center">
            <p className="text-gray-700">No questions available.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="h-screen flex flex-row bg-cover bg-center bg-no-repeat w-full overflow-hidden"
      style={{ backgroundImage: "url('/images/red-pattern.jpg')" }}
    >
      {/* Sidebar - Fixed */}
      <aside className="fixed left-0 top-0 h-screen w-[20vw] pt-20 px-8 pb-8 text-white flex flex-col z-10 overflow-y-auto mt-[5%]">
        <Image
          src="/acmviticon.svg"
          alt="ACM VIT icon"
          width={120}
          height={120}
          className="mb-8 ml-8"
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

      {/* Main Content - with left margin to account for fixed sidebar */}
      <main className="ml-[20vw] flex-1 flex items-center justify-center px-8 py-10 h-screen overflow-hidden mt-5">
        {renderActiveSection()}
      </main>
    </div>
  );
}
