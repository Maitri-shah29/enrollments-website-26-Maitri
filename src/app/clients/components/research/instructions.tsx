"use client";

import NetworkGraph from "./network-graph";

export default function Instructions() {
  return (
    <div className="relative w-full min-h-screen bg-[#1A1A1A] text-white overflow-hidden">
      {/* Background Graph (interactive) */}
      <div className="absolute inset-0 z-0">
        <NetworkGraph />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 px-16 py-20 max-w-7xl">
        <h1 className="text-[20px] font-semibold text-[#C8B7FF] mb-4 font-monopoly-bold">
          Instructions
        </h1>

        <p className="text-gray-300 leading-relaxed text-justify font-monopoly">
          Welcome to the first round of ACM-VIT's Research Domain recruitment!
          In this round, you'll have the opportunity to demonstrate your
          analytical thinking, curiosity, and passion for exploring cutting-edge
          topics in computer science. You'll be presented with a series of
          questions that assess your research aptitude, critical thinking
          skills, and ability to engage with complex technical concepts.
          <br />
          <br />
          You can select a maximum of 2 Areas of Interest (AOIs) that resonate
          with your research aspirations and academic goals. These AOIs will
          help us understand your focus areas and may guide the research
          projects you'll contribute to if selected. Once you've completed all
          the questions, review your answers thoroughly and click submit. We're
          looking for individuals who demonstrate genuine curiosity, strong
          analytical skills, and the dedication to contribute meaningfully to
          the advancement of knowledge in their chosen fields. Good luck!
        </p>
      </div>
    </div>
  );
}
