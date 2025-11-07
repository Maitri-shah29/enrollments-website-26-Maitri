"use client";
import Image from "next/image";

type TechLandingProps = {
  onGetStarted: () => void;
};

const TechLanding = ({ onGetStarted }: TechLandingProps) => {
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
