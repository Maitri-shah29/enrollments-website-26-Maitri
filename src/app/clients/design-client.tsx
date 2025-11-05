"use client";
import type { Domain } from "@prisma/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { QuestionPayload } from "@/lib/validation";
import createFormSubmission from "../actions/create-form-submission";
import fetchRound from "../actions/fetch-round-details";
import getRoundQuestions from "../actions/get-round-questions";
import About from "./components/design/about";
import AOIs from "./components/design/aoi";
import DesignNavbar from "./components/design/design-navbar";
import Home from "./components/design/home";
import Instructions from "./components/design/instructions";
import Interview from "./components/design/interview";
import Questions from "./components/design/questions";

const DesignClient = () => {
  const [activeSection, setActiveSection] = useState("Landing");
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [roundInitDone, setRoundInitDone] = useState(false);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // key: questionId
  const [errors, setErrors] = useState<Record<string, string>>({}); // key: questionId
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");

  //Load Design Round 1 data when the section is  opened for the first time
  useEffect(() => {
    const load = async () => {
      if (roundInitDone || loading || activeSection !== "Round 1") return;
      setLoading(true);
      setInitError(null);
      try {
        const domain: Domain = "design";
        const rounds = await fetchRound(domain);

        // Check if user is not logged in
        if (!Array.isArray(rounds)) {
          setInitError("Please sign in to view Design rounds.");
          setLoading(false);
          setRoundInitDone(true);
          return;
        }

        //Check if rounds exist
        if (rounds.length === 0) {
          setInitError("No active rounds found for design.");
          setLoading(false);
          setRoundInitDone(true);
          return;
        }
        const r = rounds[0];
        setRoundId(r.id);

        //Fetch questions with error handling
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

        //Create form submission
        const createRes = await createFormSubmission(r.id);

        //Accept both freshly created and already exisiting submission
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
          createRes.error === "Users do not exist for this round"
        ) {
          setFormWarning(
            "You're not registered for this round yet; you can view questions but cannot save answers.",
          );
        }
      } catch (e) {
        console.error("[design] init load failed", e);
        setInitError("Failed to load round/questions. Try again later.");
      } finally {
        setLoading(false);
        setRoundInitDone(true);
      }
    };
    load();
  }, [activeSection, loading, roundInitDone]);
  return (
    <div className="flex flex-col w-full h-full border border-black text-white">
      <Image
        src="/images/design/background.svg"
        alt="About Design"
        width={1920}
        height={1080}
        className="w-full h-full object-cover absolute top-0 left-0"
      />
      <Image
        src="/images/design/acmlogo.svg"
        alt="About Design"
        width={400}
        height={400}
        className="w-[15vw] object-cover absolute top-5 left-5 z-30"
      />

      <DesignNavbar selected={selectedPanel} onSelect={setSelectedPanel} />
      <div className="flex overflow-y-auto z-10">
        {selectedPanel === "Home" && <Home />}
        {selectedPanel === "About" && <About />}
        {selectedPanel === "Instructions" && <Instructions />}
        {selectedPanel === "AOIs" && <AOIs />}
        {selectedPanel === "Questions" && <Questions />}
        {selectedPanel === "Interview" && <Interview />}
      </div>
    </div>
  );
};

export default DesignClient;
