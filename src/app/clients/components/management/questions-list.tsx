"use client";
import type { Domain } from "@prisma/client";
import { useEffect, useState } from "react";
import fetchRound from "@/app/actions/fetch-round-details";
import getRoundQuestions from "@/app/actions/get-round-questions";
import type { QuestionPayload } from "@/lib/validation";
import Header from "./header";
import QuestionBox from "./question-box";
import { QuestionCheckBox } from "./question-checkbox";

type QuestionListProps = {
  activeSection: string;
};

export default function QuestionList({ activeSection }: QuestionListProps) {
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [roundInitDone, setRoundInitDone] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (roundInitDone || loading || activeSection !== "Round 1") return;
      setLoading(true);
      setInitError(null);

      try {
        const domain: Domain = "management";
        const rounds = await fetchRound(domain);
        if (!Array.isArray(rounds) || rounds.length === 0) {
          setInitError("No active rounds found for Management.");
          return;
        }

        const round = rounds[0];
        const qres = await getRoundQuestions(round.id);
        const qs = (qres?.questions ?? []).sort(
          (a, b) => (a.serial ?? 0) - (b.serial ?? 0),
        ) as QuestionPayload[];
        setQuestions(qs);
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

  function handleCheckboxClick(qid: string) {
    setSelectedQuestion(qid);
  }

  return (
    <>
      {selectedQuestion !== null ? (
        <QuestionBox
          id={selectedQuestion}
          goBack={() => setSelectedQuestion(null)}
        />
      ) : (
        <div className="relative bg-white opacity-[70%] backdrop-blur-md rounded-2xl w-[90%] h-full shadow-lg overflow-y-auto">
          <Header />

          <div className="p-2">
            {loading && <p className="text-gray-700 text-center">Loading…</p>}
            {initError && (
              <p className="text-red-600 text-center" role="alert">
                {initError}
              </p>
            )}

            {!loading && !initError && questions.length === 0 && (
              <p className="text-gray-700 text-center">No questions.</p>
            )}

            <div className="space-y-1 max-w-3xl">
              {questions.map((q, index) => (
                <QuestionCheckBox
                  key={q.id}
                  index={index}
                  question={q.question}
                  onClick={() => {
                    handleCheckboxClick(q.id);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
