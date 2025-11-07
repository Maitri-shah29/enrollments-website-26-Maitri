"use client";

import type { Domain } from "@prisma/client";
import { Pencil, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { QuestionPayload } from "@/lib/validation";
import { validateAnswer } from "@/lib/validation";
import createFormSubmission from "../actions/create-form-submission";
import ensureRoundUser from "../actions/ensure-round-user";
import fetchRound from "../actions/fetch-round-details";
import getRoundQuestions from "../actions/get-round-questions";
import saveFormResponse from "../actions/save-form-response";
import About from "./components/management/about";
import Instructions from "./components/management/instructions";
import ManagementLanding from "./components/management/landing";
import QuestionsList from "./components/management/questions-list";
import WhatWeDo from "./components/management/whatwedo";

export default function Management() {
  const [activeSection, setActiveSection] = useState("Landing");
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [roundInitDone, setRoundInitDone] = useState(false);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // key: questionId
  const [errors, setErrors] = useState<Record<string, string>>({}); // key: questionId
  const [successMessages, setSuccessMessages] = useState<
    Record<string, string>
  >({}); // key: questionId
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
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

  useEffect(() => {
    const load = async () => {
      if (roundInitDone || loading || activeSection !== "Round 1") return;
      setLoading(true);
      setInitError(null);
      try {
        const domain: Domain = "management";

        const rounds = await fetchRound(domain);

        if (!Array.isArray(rounds)) {
          setInitError("Please sign in to view Management rounds.");
          setLoading(false);
          setRoundInitDone(true);
          return;
        }

        if (rounds.length === 0) {
          setInitError("No active rounds found for Management.");
          setLoading(false);
          setRoundInitDone(true);
          return;
        }

        const r = rounds[0];
        setRoundId(r.id);

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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  function onChangeAnswer(qid: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
    // Clear both errors and success messages when user types
    if (errors[qid]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[qid];
        return next;
      });
    }
    if (successMessages[qid]) {
      setSuccessMessages((prev) => {
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
      await saveFormResponse(formId, q.id, current || null);

      // Clear any error for this question
      setErrors((prev) => {
        const next = { ...prev };
        delete next[q.id];
        return next;
      });

      // Set success message
      setSuccessMessages((prev) => ({
        ...prev,
        [q.id]: "Saved successfully!",
      }));

      // Clear any existing timeout for this question
      if (timeoutRef.current[q.id]) {
        clearTimeout(timeoutRef.current[q.id]);
      }

      // Clear success message after 2 seconds
      timeoutRef.current[q.id] = setTimeout(() => {
        setSuccessMessages((prev) => {
          const next = { ...prev };
          delete next[q.id];
          return next;
        });
        delete timeoutRef.current[q.id];
      }, 2000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save";
      // Clear success message and set error
      setSuccessMessages((prev) => {
        const next = { ...prev };
        delete next[q.id];
        return next;
      });
      setErrors((prev) => ({ ...prev, [q.id]: message }));
    }
  }

  const handleGetStarted = () => {
    setActiveSection("About");
  };
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
              <p className="text-white">Loading round...</p>
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
          <>
            {formWarning ? (
              <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
                {formWarning}
              </div>
            ) : null}
            <QuestionsList
              questions={questions}
              answers={answers}
              errors={errors}
              successMessages={successMessages}
              onChangeAnswer={onChangeAnswer}
              onSubmitAnswer={onSubmitAnswer}
            />
          </>
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
      className="h-full flex flex-row bg-cover bg-center bg-no-repeat w-full overflow-x-hidden"
      style={{ backgroundImage: "url('/images/red-pattern.jpg')" }}
    >
      {/* Sidebar */}
      <aside className="flex flex-col h-full w-[20vw] p-8 text-white">
        <Image
          src="/acmviticon.svg"
          alt="ACM VIT icon"
          width={180}
          height={180}
          className="mb-8"
        />

        <div className="flex mb-5 items-center w-[80%] h-12 gap-2 bg-[#d7aaaa] text-[#6b5f5f] px-4 py-2 rounded-xl drop-shadow-lg/40 ">
          <Pencil /> <span className="font-medium">Compose</span>
        </div>

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
      <main className="flex-1 flex flex-col justify-center items-center px-8">
        <div className="w-full flex justify-between items-center h-[8%] px-4">
          {/* Empty left spacer for layout balance */}
          <div className="w-[100px]" />

          {/* Search bar centered */}
          <div className="p-2 gap-2 flex flex-row items-center bg-white/40 w-[50%] rounded-full mt-2">
            <Search />
            <input
              type="text"
              placeholder="Search"
              className="outline-none flex-1 text-white placeholder-white-500"
            />
          </div>

          {/* Settings and Profile buttons on the right */}
          <div className="flex gap-4 items-center mt-2">
            <Image
              src="/images/management/settings.svg"
              alt="Settings"
              width={26}
              height={27}
              className="cursor-pointer"
            />
            <Image
              src="/images/management/person-circle-outline.svg"
              alt="Profile"
              width={45}
              height={45}
              className="cursor-pointer"
            />
          </div>
        </div>

        <div className="h-[90%] w-full flex items-center justify-center">
          {renderActiveSection()}
        </div>
      </main>
    </div>
  );
}
