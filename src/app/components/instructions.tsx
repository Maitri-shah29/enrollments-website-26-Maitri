"use client";

import Image from "next/image";
import type React from "react";

interface InstructionsProps {
  onGetStarted: () => void;
}

const Instructions: React.FC<InstructionsProps> = ({ onGetStarted }) => {
  return (
    <div className="w-screen h-screen absolute z-10">
      <Image
        src="/images/acm-mobile-logo.svg"
        alt="ACM Logo"
        width={200}
        height={100}
        className="absolute top-10 left-10"
      />
      <video
        autoPlay
        loop
        muted
        className="w-full h-full object-cover"
        poster="/poster.png"
        src="/bg.mp4"
      >
        <track kind="captions" />
      </video>
      <div className="z-10 top-0 absolute flex w-full h-full items-center justify-center flex-col">
        <video
          src="/FINAL_INSTRUCTIONS.mp4"
          width={900}
          height={450}
          controls
          className="rounded-lg shadow-xl"
          autoPlay={true}
        >
          <track kind="captions" />
        </video>
        <button
          type="button"
          onClick={onGetStarted}
          className="border-2 rounded-xl px-4 py-2 mt-6 font-bold text-2xl
           transition-all duration-200 hover:shadow-[0_0_10px_rgba(255,255,255,0.8)] bg-blur bg-white/20"
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
};

export default Instructions;
