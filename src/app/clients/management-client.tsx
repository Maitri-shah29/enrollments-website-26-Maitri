"use client";

import type { Domain } from "@prisma/client";
import { Pencil, Search, Settings } from "lucide-react";
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

interface ManagementClientProps {
  initialRoundId?: string | null;
  initialQuestions?: QuestionPayload[];
  initialFormId?: string | null;
  initialInitError?: string | null;
  initialFormWarning?: string | null;
}

export default function Management({
  initialRoundId,
  initialQuestions,
  initialFormId,
  initialInitError,
  initialFormWarning,
}: ManagementClientProps) {
  const [activeSection, setActiveSection] = useState("Landing");
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [roundInitDone, setRoundInitDone] = useState(false);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessages, setSuccessMessages] = useState<
    Record<string, string>
  >({});
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Memoize answers by varName
  const answersByVar = useMemo(() => {
    const map: Record<string, string> = {};
    for (const q of questions) {
      if (q.varName) {
        map[q.varName] = answers[q.id] || "";
      }
    }
    return map;
  }, [questions, answers]);

  // ✅ Proper initialization logic
  useEffect(() => {
    const load = async () => {
      if (roundInitDone || loading || activeSection !== "Round 1") return;
      // If server provided initial data, hydrate and short-circuit
      if (
        (initialRoundId ||
          initialQuestions ||
          initialFormId ||
          initialInitError ||
          initialFormWarning) &&
        !roundInitDone
      ) {
        if (initialRoundId) setRoundId(initialRoundId);
        if (initialQuestions && initialQuestions.length > 0) {
          setQuestions(initialQuestions);
          const initialAnswers: Record<string, string> = {};
          initialQuestions.forEach((q) => {
            initialAnswers[q.id] = "";
          });
          setAnswers(initialAnswers);
        }
        if (initialFormId) setFormId(initialFormId);
        if (initialInitError) setInitError(initialInitError);
        if (initialFormWarning) setFormWarning(initialFormWarning);
        setRoundInitDone(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setInitError(null);

      try {
        const domain: Domain = "management";
        const rounds = await fetchRound(domain);

        if (!Array.isArray(rounds) || rounds.length === 0) {
          setInitError("No active rounds found for Management.");
          setRoundInitDone(true);
          return;
        }

        const r = rounds[0];
        setRoundId(r.id);

        // Fetch questions
        const qres = await getRoundQuestions(r.id);
        if (!qres?.questions) {
          setInitError("Failed to load questions. Try again.");
          setRoundInitDone(true);
          return;
        }

        const qs = [...(qres.questions || [])].sort(
          (a, b) => (a.serial ?? 0) - (b.serial ?? 0)
        ) as QuestionPayload[];

        setQuestions(qs);

        // Initialize answers as empty strings
        const initial: Record<string, string> = {};
        qs.forEach((q) => (initial[q.id] = ""));
        setAnswers(initial);

        // Ensure user is part of round
        const ensureRes = await ensureRoundUser(r.id);
        if (ensureRes?.error === "Not logged in") {
          setInitError("Please sign in to answer questions.");
          setRoundInitDone(true);
          return;
        }

        if (ensureRes?.error) {
          setFormWarning(
            "Could not link you to this round; you can view questions but cannot save answers."
          );
        }

        // Create or fetch form submission
        const createRes = await createFormSubmission(r.id);
        const fid =
          createRes && "formSubmission" in createRes
            ? createRes.formSubmission?.id
            : undefined;

        if (fid) setFormId(fid);
        else if (createRes?.error === "Not logged in") {
          setInitError("Please sign in to answer questions.");
        } else if (createRes?.error === "User does not exist for this round") {
          setFormWarning(
            "You're not registered for this round yet; you can view questions but cannot save answers."
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
  }, [
    activeSection,
    loading,
    roundInitDone,
    initialRoundId,
    initialQuestions,
    initialFormId,
    initialInitError,
    initialFormWarning,
  ]);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  function onChangeAnswer(qid: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
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
    const current = answers[q.id] || "";
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
      setSuccessMessages((prev) => ({
        ...prev,
        [q.id]: "Saved successfully!",
      }));
      if (timeoutRef.current[q.id]) clearTimeout(timeoutRef.current[q.id]);
      timeoutRef.current[q.id] = setTimeout(() => {
        setSuccessMessages((prev) => {
          const next = { ...prev };
          delete next[q.id];
          return next;
        });
      }, 2000);
    } catch (e) {
      setErrors((prev) => ({ ...prev, [q.id]: "Failed to save" }));
    }
  }

  const handleGetStarted = () => setActiveSection("About");

  const renderActiveSection = () => {
    switch (activeSection) {
      case "Landing":
        return (
          <ManagementLanding
            onGetStarted={handleGetStarted}
            wallpaper={wallpaper}
          />
        );
      case "About":
        return <About />;
      case "What we do":
        return <WhatWeDo />;
      case "Instructions":
        return <Instructions />;
      case "Round 1":
        if (loading) return <p className="text-white">Loading round...</p>;
        if (initError)
          return <p className="text-red-600 font-semibold">{initError}</p>;
        return roundId && questions.length > 0 ? (
          <>
            {formWarning && (
              <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
                {formWarning}
              </div>
            )}
            <QuestionsList
              questions={questions}
              answers={answers}
              errors={errors}
              successMessages={successMessages}
              onChangeAnswer={onChangeAnswer}
              onSubmitAnswer={onSubmitAnswer}
              wallpaper={wallpaper}
            />
          </>
        ) : (
          <p className="text-gray-700">No questions available.</p>
        );
      default:
        return null;
    }
  };

  const [settings, setSettings] = useState(false);
  const [wallpaper, setWallpaper] = useState("big sur");
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("selectedWallpaper");
    if (saved) setWallpaper(saved);
  }, []);

  const handleWallpaperChange = (wall: string) => {
    setFade(true);
    setTimeout(() => {
      setWallpaper(wall);
      localStorage.setItem("selectedWallpaper", wall);
      setFade(false);
    }, 300);
  };

  return (
    <div className="h-full flex w-full overflow-hidden font-helvetica">
      {/* Background image */}
      <Image
        src={`/images/management/wallpapers/${wallpaper}.svg`}
        width={1920}
        height={1080}
        alt="bg"
        className={`absolute top-0 left-0 object-cover w-full h-full transition-opacity duration-500 ${
          fade ? "opacity-60" : "opacity-100"
        }`}
      />

      {/* Dark overlay during fade */}
      <div
        className={`absolute top-0 left-0 w-full h-full bg-black/60 transition-opacity duration-500 pointer-events-none ${
          fade ? "opacity-100 backdrop-blur-lg" : "opacity-0"
        }`}
      />

      {/* Sidebar */}
      <aside className="flex flex-col h-full w-[20vw] py-8 px-4 text-white z-10 font-helvetica">
        <Image
          src="/acmviticon.svg"
          alt="ACM VIT icon"
          width={180}
          height={180}
          className="mb-8"
        />
        <div className="flex mb-5 items-center w-[80%] h-12 gap-2 bg-[#ececec] text-[#6b5f5f] px-4 py-2 rounded-xl drop-shadow-md/20">
          <Pencil /> <span className="font-medium">Compose</span>
        </div>
        <nav className="flex flex-col space-y-2 text-lg">
          {["About", "What we do", "Instructions", "Round 1"].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`rounded-4xl px-6 py-2 text-left font-medium transition ${
                activeSection === section
                  ? "bg-[#ececec] text-[#6b5f5f] drop-shadow-lg/"
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
        <div className="flex w-full justify-center items-center relative mt-5">
          {/* Search bar */}
          <div className="px-5 py-2 gap-2 flex flex-row bg-white/60 backdrop-blur-xl w-[90%] justify-center items-center rounded-full shadow-md">
            <Search className="text-black" />
            <input
              type="text"
              placeholder="Search Mail"
              className="outline-none flex-1 text-black placeholder-gray-600 bg-transparent"
            />
          </div>

          {/* Settings Dropdown */}
          <div className="ml-4 relative">
            <button
              onClick={() => setSettings(!settings)}
              className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-xl flex items-center justify-center shadow-md hover:scale-105 transition-transform"
            >
              <Settings className="text-black" />
            </button>

            {settings && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-3 w-48 flex flex-col gap-2 z-100 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/30 shadow-lg p-3 animate-[fadeIn_0.2s_ease-out]"
              >
                {["sonoma", "sequoia", "big sur"].map((wall, index) => (
                  <div
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWallpaperChange(wall);
                      setSettings(false);
                    }}
                    className="cursor-pointer flex items-center justify-center"
                  >
                    <div className="group relative flex items-center justify-center">
                      <Image
                        src={`/images/management/wallpapers/${wall}.svg`}
                        width={500}
                        height={500}
                        alt={wall}
                        className="rounded-lg transition-all duration-300 group-hover:brightness-50"
                      />
                      <span className="absolute text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {wall}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-[90%] w-full flex items-center justify-center">
          {renderActiveSection()}
        </div>
      </main>
    </div>
  );
}
