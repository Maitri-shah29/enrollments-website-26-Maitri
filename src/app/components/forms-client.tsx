"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  cloneRounds,
  DOMAIN_LABELS,
  DOMAINS,
  type Domain,
  type Round,
} from "@/lib/domain";

const DOMAIN_ROUNDS_TEMPLATES: Record<Domain, Round[]> = {
  tech: [
    {
      title: "Round 1",
      questions: [
        { question: "againn ppp?", answer: "" },
        { question: "againn?", answer: "" },
      ],
    },
    {
      title: "Round 2",
      questions: [
        { question: "a 1?", answer: "" },
        { question: "a?", answer: "" },
      ],
    },
    {
      title: "Round 3",
      questions: [
        { question: "b 1?", answer: "" },
        { question: "b?", answer: "" },
      ],
    },
    {
      title: "Round 4",
      questions: [
        { question: "d 1?", answer: "" },
        { question: "d?", answer: "" },
      ],
    },
    {
      title: "Round 5",
      questions: [
        { question: "e 1?", answer: "" },
        { question: "e?", answer: "" },
      ],
    },
  ],

  managment: [
    {
      title: "Round 1",
      questions: [
        { question: "f 1?", answer: "" },
        { question: "f?", answer: "" },
      ],
    },
    {
      title: "Round 2",
      questions: [
        { question: "g 1?", answer: "" },
        { question: "g?", answer: "" },
      ],
    },
    {
      title: "Round 3",
      questions: [
        { question: "h 1?", answer: "" },
        { question: "h?", answer: "" },
        { question: "h 2?", answer: "" },
      ],
    },
    {
      title: "Round 4",
      questions: [
        { question: "i 1?", answer: "" },
        { question: "i?", answer: "" },
      ],
    },
    {
      title: "Round 5",
      questions: [
        { question: "j 1?", answer: "" },
        { question: "j?", answer: "" },
      ],
    },
  ],

  research: [
    {
      title: "Round 1",
      questions: [
        { question: "k 1?", answer: "" },
        { question: "k?", answer: "" },
      ],
    },
    {
      title: "Round 2",
      questions: [
        { question: "l 1?", answer: "" },
        { question: "l?", answer: "" },
      ],
    },
    {
      title: "Round 3",
      questions: [
        { question: "m 1?", answer: "" },
        { question: "m?", answer: "" },
      ],
    },
    {
      title: "Round 4",
      questions: [
        { question: "n 1?", answer: "" },
        { question: "n?", answer: "" },
      ],
    },
    {
      title: "Round 5",
      questions: [
        { question: "o 1?", answer: "" },
        { question: "o 2?", answer: "" },
        { question: "o?", answer: "" },
      ],
    },
  ],

  cc: [
    {
      title: "Round 1",
      questions: [
        { question: "p 1?", answer: "" },
        { question: "p?", answer: "" },
      ],
    },
    {
      title: "Round 2",
      questions: [
        { question: "q 1?", answer: "" },
        { question: "q ?", answer: "" },
      ],
    },
    {
      title: "Round 3",
      questions: [
        { question: "r 1?", answer: "" },
        { question: "r?", answer: "" },
      ],
    },
    {
      title: "Round 4",
      questions: [
        { question: "s 1?", answer: "" },
        { question: "s?", answer: "" },
      ],
    },
    {
      title: "Round 5",
      questions: [
        { question: "t 1?", answer: "" },
        { question: "t?", answer: "" },
      ],
    },
  ],

  desgin: [
    {
      title: "Round 1",
      questions: [
        { question: "u 1?", answer: "" },
        { question: "u?", answer: "" },
      ],
    },
    {
      title: "Round 2",
      questions: [
        { question: "v 1?", answer: "" },
        { question: "v?", answer: "" },
      ],
    },
    {
      title: "Round 3",
      questions: [
        { question: "w 1?", answer: "" },
        { question: "w?", answer: "" },
      ],
    },
    {
      title: "Round 4",
      questions: [
        { question: "x 1?", answer: "" },
        { question: "x?", answer: "" },
      ],
    },
    {
      title: "Round 5",
      questions: [
        { question: "y 1?", answer: "" },
        { question: "y?", answer: "" },
      ],
    },
  ],
};

function SendIcon() {
  return <Image src="/send-alt.svg" alt="Send" width={20} height={20} />;
}

export default function FormsClient() {
  const [domain, setDomain] = useState<Domain>(DOMAINS[0]);
  const [rounds, setRounds] = useState<Round[]>(() =>
    cloneRounds(DOMAIN_ROUNDS_TEMPLATES[DOMAINS[0]]),
  );
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<
    Record<number, string>
  >({});

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const currentRound = useMemo(
    () => rounds[activeRoundIndex],
    [rounds, activeRoundIndex],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (activeRoundIndex >= 0) {
        inputRefs.current[0]?.focus();
      }
    }, 0);
    return () => clearTimeout(t);
  }, [activeRoundIndex]);

  function handleDomainChange(e: ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Domain;
    setDomain(next);
    setRounds(cloneRounds(DOMAIN_ROUNDS_TEMPLATES[next]));
    setActiveRoundIndex(0);
    setValidationErrors({});
  }

  function handleInputChange(qIndex: number, value: string) {
    setRounds((prev) =>
      prev.map((r, ri) =>
        ri !== activeRoundIndex
          ? r
          : {
              ...r,
              questions: r.questions.map((q, qi) =>
                qi === qIndex ? { ...q, answer: value } : q,
              ),
            },
      ),
    );
    if (validationErrors[qIndex]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[qIndex];
        return next;
      });
    }
  }

  function validateRequired(answer: string): boolean {
    return answer.trim().length > 0;
  }

  function handleSubmit(e: FormEvent, qIndex: number) {
    e.preventDefault();
    const q = currentRound.questions[qIndex];
    if (!q) return;

    const isValid = validateRequired(q.answer);
    const domainLabel = DOMAIN_LABELS[domain];

    console.log(
      `[forms] submit: domain=${domain} (${domainLabel}) | round=${currentRound.title} | q=${qIndex + 1} | question="${q.question}" | answer=`,
      q.answer,
    );
    console.log(
      `[validation] required check: ${isValid ? "valid" : "invalid"}`,
    );

    if (!isValid) {
      setValidationErrors((prev) => ({
        ...prev,
        [qIndex]: "This field is required and cannot be empty",
      }));
      return;
    }

    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[qIndex];
      return next;
    });

    setRounds((prev) =>
      prev.map((r, ri) =>
        ri !== activeRoundIndex
          ? r
          : {
              ...r,
              questions: r.questions.map((qq, qi) =>
                qi === qIndex ? { ...qq, answer: "" } : qq,
              ),
            },
      ),
    );
    setTimeout(() => inputRefs.current[qIndex + 1]?.focus(), 0);
  }

  return (
    <div className="h-full min-h-0 bg-white flex flex-col md:flex-row">
      <aside className="w-full md:w-72 md:shrink-0 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50 p-4 md:p-6 md:sticky md:top-0 md:h-screen md:flex md:flex-col">
        <div className="mb-6">
          <label
            htmlFor="domain-select"
            className="block text-sm font-medium text-gray-700 mb-2 sr-only"
          >
            Select domain
          </label>
          <select
            id="domain-select"
            value={domain}
            onChange={handleDomainChange}
            aria-label="Select domain"
            className="w-full h-10 rounded-md border-gray-300 bg-white shadow-sm px-3 text-[15px] text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {DOMAIN_LABELS[d]}
              </option>
            ))}
          </select>
        </div>

        <div className="md:flex-1 md:flex md:items-center">
          <nav className="w-full flex flex-col space-y-2">
            {rounds.map((r, i) => (
              <button
                key={r.title}
                type="button"
                onClick={() => setActiveRoundIndex(i)}
                className={`text-left py-2.5 px-3 rounded-md transition-colors ${i === activeRoundIndex ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-200" : "text-gray-700 hover:bg-gray-100"}`}
                aria-current={i === activeRoundIndex}
              >
                {r.title}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 px-4 md:px-8 py-6 md:py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 md:mb-10">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
              {currentRound.title} : {DOMAIN_LABELS[domain]}
            </h1>
          </div>

          <div className="space-y-10">
            {currentRound.questions.map((q, qi) => (
              <section key={q.question}>
                <h3 className="mb-3 text-gray-900 font-semibold text-base md:text-lg">
                  Q{qi + 1} {q.question}
                </h3>
                <form
                  onSubmit={(e) => handleSubmit(e, qi)}
                  className="relative"
                >
                  <input
                    id={`input-${activeRoundIndex}-${qi}`}
                    ref={(el) => {
                      inputRefs.current[qi] = el;
                    }}
                    value={q.answer}
                    onChange={(e) => handleInputChange(qi, e.target.value)}
                    className={`w-full p-4 pr-14 bg-white text-gray-900 shadow-sm border rounded-xl focus:ring-2 transition placeholder:text-gray-500 ${
                      validationErrors[qi]
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="type your answer..."
                    aria-label={`Answer for ${q.question}`}
                    aria-invalid={!!validationErrors[qi]}
                    aria-describedby={
                      validationErrors[qi] ? `error-${qi}` : undefined
                    }
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:bg-gray-300"
                    aria-label={`Submit answer for ${activeRoundIndex}-${qi}`}
                    disabled={!q.answer.trim()}
                  >
                    <SendIcon />
                  </button>
                </form>
                {validationErrors[qi] && (
                  <p
                    id={`error-${qi}`}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1"
                    role="alert"
                  >
                    <span aria-hidden="true">⚠</span>
                    {validationErrors[qi]}
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
