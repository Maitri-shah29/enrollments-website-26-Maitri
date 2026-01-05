"use client";
import Image from "next/image";

type TechLandingProps = {
  onGetStarted: () => void;
  loading?: boolean;
  hasRoundUser?: boolean;
  onContinue?: () => void;
  showResults?: boolean;
  onViewResults?: () => void;
};

const TechLanding = ({
  onGetStarted,
  loading = false,
  hasRoundUser = false,
  onContinue,
  showResults = false,
  onViewResults,
}: TechLandingProps) => {
  const showResultsCta = showResults && !!onViewResults;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      {/* botm left tornado*/}
      <Image
        src="/images/ascii-art-tech.svg"
        alt="tech asciitornado bottom left"
        width={280}
        height={280}
        className="absolute bottom-0 left-0 pointer-events-none opacity-50"
      />
      {/* botm right tornado*/}
      <Image
        src="/images/ascii-art-tech.svg"
        alt="tech ascii tornado bottom right"
        width={360}
        height={360}
        className="absolute bottom-20 right-16 pointer-events-none opacity-55"
      />
      <div className="overflow-hidden relative z-10">
        <Image
          src="/images/welcome-tech.svg"
          alt="welcome image"
          width={600}
          height={600}
          className="pointer-events-none"
        />
      </div>
      <div className="mt-12 relative z-10">
        <button
          type="button"
          onClick={
            showResultsCta ? onViewResults : hasRoundUser ? onContinue : onGetStarted
          }
          disabled={loading && !hasRoundUser && !showResultsCta}
          className="bg-transparent border text-white border-[#993C7A] hover:bg-[#993C7A] px-10 py-2 mt-6 font-jetbrains text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {showResultsCta
            ? "View Results"
            : hasRoundUser
              ? "Continue"
              : loading
                ? "Loading..."
                : "Get Started"}
        </button>
      </div>
    </div>
  );
};

export default TechLanding;
