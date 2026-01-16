"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { signIn } from "@/lib/auth-client";
import type { ResultsSummary } from "@/lib/results";
import { useSessionContext } from "./session-provider";

const CONFETTI_COLORS = [
  "#F55F4B",
  "#7D5BED",
  "#C9EB3E",
  "#5CAFFF",
  "#FFB347",
  "#43A363",
];

type ResultsScreenProps = {
  resultsSummary?: ResultsSummary | null;
  onContinue: () => void;
};

const ResultsScreen: React.FC<ResultsScreenProps> = ({
  resultsSummary,
  onContinue,
}) => {
  const { session } = useSessionContext();
  const isLoggedIn = !!session?.data?.user;

  const hasPromoted = (resultsSummary?.promotedDomains?.length ?? 0) > 0;
  const selectedDomainLabel =
    resultsSummary?.domains.find((entry) => entry.status === "promoted")
      ?.label ??
    resultsSummary?.primaryLabel ??
    "your domain";
  const hasPending =
    !hasPromoted && resultsSummary?.primaryStatus === "pending";
  const accentColor = hasPromoted
    ? "#C9EB3E"
    : hasPending
      ? "#FBBF24"
      : "#F55F4B";

  const [confettiPieces, setConfettiPieces] = useState<
    Array<{
      size: number;
      left: number;
      delay: number;
      duration: number;
      color: string;
    }>
  >([]);

  useEffect(() => {
    if (!hasPromoted) {
      setConfettiPieces([]);
      return;
    }
    const next = Array.from({ length: 25 }, (_, index) => {
      const size = 6 + (index % 5);
      const left = Math.random() * 100;
      const delay = Math.random() * 1;
      const duration = 3 + Math.random() * 2;
      const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
      return { size, left, delay, duration, color };
    });
    setConfettiPieces(next);
  }, [hasPromoted]);

  return (
    <div className="relative h-full w-full bg-[#0a0a0a] text-white">
      {/* Confetti */}
      {hasPromoted && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          {confettiPieces.map((piece, index) => (
            <span
              key={index}
              className="confetti-piece-enhanced"
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}px`,
                height: `${piece.size * 1.4}px`,
                backgroundColor: piece.color,
                animationDuration: `${piece.duration}s`,
                animationDelay: `${piece.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 mx-auto flex h-full w-full max-w-2xl flex-col justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <div className="relative h-16 w-56">
            <Image
              src="/images/acmlogo.svg"
              alt="ACM logo"
              fill
              sizes="224px"
              className="object-contain"
            />
          </div>
        </div>

        {/* Content */}
        {!isLoggedIn ? (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-poppins text-white mb-3">
                View Your Results
              </h1>
              <p className="text-white/50 font-poppinsReg">
                Log in to see your selection status.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void signIn()}
                className="px-6 py-2.5 rounded-full bg-white text-black font-poppinsReg text-sm hover:bg-white/90 transition-colors"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="px-6 py-2.5 rounded-full border border-white/15 text-white/60 font-poppinsReg text-sm hover:text-white hover:border-white/30 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        ) : !resultsSummary ? (
          <div className="space-y-6">
            <p className="text-white/50 font-poppinsReg">Loading results...</p>
            <button
              type="button"
              onClick={onContinue}
              className="px-6 py-2.5 rounded-full border border-white/15 text-white/60 font-poppinsReg text-sm hover:text-white hover:border-white/30 transition-colors"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {hasPromoted ? (
              <div className="space-y-4 text-white/60 font-poppinsReg leading-relaxed">
                <p className="text-white font-poppins text-2xl sm:text-3xl">
                  Congratulations!
                </p>
                <p>
                  You are now officially part of the ACM-VIT Organising
                  Committee 2026.
                </p>
                <p>
                  Further instructions regarding onboarding and next steps will
                  be shared soon.
                </p>
                <p>Welcome to the team!</p>
              </div>
            ) : hasPending ? (
              <div className="space-y-6">
                <div
                  className="inline-block px-3 py-1 rounded-full text-xs font-poppinsReg uppercase tracking-wide"
                  style={{
                    color: accentColor,
                    backgroundColor: `${accentColor}10`,
                  }}
                >
                  Pending
                </div>
                <h1 className="text-4xl sm:text-5xl font-poppins text-white leading-tight">
                  Results Pending
                </h1>
                <p className="text-white/60 font-poppinsReg leading-relaxed">
                  Results are being finalized. Check back soon.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4 text-white/60 font-poppinsReg leading-relaxed">
                  <p>
                    Thank you for applying to ACM-VIT’s Organising Committee
                    Selections 2026.
                  </p>
                  <p>
                    While the final outcome didn’t go in your favour this time,
                    this is not the end of your journey. You are an integral
                    part of our ACM community.
                  </p>
                  <p>
                    We encourage you to stay connected with ACM and keep
                    learning.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onContinue}
              className="px-6 py-2.5 rounded-full bg-white text-black font-poppinsReg text-sm hover:bg-white/90 transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsScreen;
