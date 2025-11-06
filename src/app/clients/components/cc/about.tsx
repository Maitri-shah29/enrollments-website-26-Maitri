import type React from "react";
import NeonSection from "./neon-section";

const About: React.FC = () => {
  return (
    <div className="flex flex-col gap-10 font-ShareTechMono">
      <NeonSection title="ABOUT COMPETITIVE CODING">
        <p>
          We are the Competitive Coding domain of ACM, where logic, strategy,
          and innovation come together to create the ultimate coding experience!
          Whether you are a beginner eager to sharpen your problem‑solving
          skills or a seasoned coder aiming for a better stage, this domain is
          your gateway to mastering competitive programming.
        </p>
        <p>
          We specialize in curating challenging contests, cryptographic puzzles,
          and algorithmic problem sets designed to test and refine your coding
          abilities.
        </p>
      </NeonSection>

      <NeonSection title="WHAT WE DO?">
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <span className="text-[#C9EB3E]">REVERSE CODING</span> – A true test
            of logical reasoning, Reverse Coding challenges coders to
            reverse‑engineer a given set of inputs and outputs to derive the
            hidden algorithm.
          </li>
          <li>
            <span className="text-[#C9EB3E]">CRYPTIC HUNT</span> – For those who
            love puzzles, cryptography, and lateral thinking, Cryptic Hunt is
            the perfect challenge. Participants solve a series of
            cryptography‑based coding challenges that require deciphering hidden
            clues, breaking ciphers, and applying logic to progress through
            different levels.
          </li>
          <li>
            <span className="text-[#C9EB3E]">CODEX CRYPTUM</span> – A hybrid
            event combining interactive workshops, coding exercises, and live
            problem‑solving, Codex Cryptum provides an immersive learning
            experience.
          </li>
        </ul>
      </NeonSection>
    </div>
  );
};

export default About;
