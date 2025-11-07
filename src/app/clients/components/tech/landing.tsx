"use client";
import Image from "next/image";

type TechLandingProps = {
  onGetStarted: () => void;
};

const TechLanding = ({ onGetStarted }: TechLandingProps) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="overflow-hidden relative">
        <Image
          src="/images/ascii-art-tech.svg"
          alt="tech image"
          width={500}
          height={500}
          className="absolute bottom-10 right-10 pointer-events-none"
        />
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
          onClick={onGetStarted}
          className="bg-transparent border border-[#993C7A] hover:bg-[#993C7A] px-10 py-2 mt-6 font-jetbrains text-sm transition-colors cursor-pointer"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default TechLanding;
