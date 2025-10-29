import type React from "react";

const NeonSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="w-full border-4 border-[#242527] bg-transparent">
    <div className="border-b-4 border-[#242527] bg-[#242527] px-4 sm:px-6 py-2 text-[#C9EB3E] font-ShareTechMono text-base sm:text-lg">
      {title}
    </div>
    <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-white leading-relaxed tracking-wide bg-[#16171B] font-ShareTechMono">
      {children}
    </div>
  </div>
);

const About: React.FC = () => {
  return (
    <>
      <NeonSection title="About competitive coding">
        <p>
          We are the Competitive Coding domain of ACM, where logic, strategy,
          and innovation come together to create the ultimate coding experience!
          Whether you are a beginner eager to sharpen your problem‑solving
          skills or a seasoned coder aiming for a better stage, this domain is
          your gateway to mastering competitive programming.
        </p>
        <p className="mt-4">
          We specialize in curating challenging contests, cryptographic puzzles,
          and algorithmic problem sets designed to test and refine your coding
          abilities.
        </p>
      </NeonSection>

      <NeonSection title="What we do – our flagship events">
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <span className="text-[#C9EB3E]">Reverse Coding</span> – A true test
            of logical reasoning, Reverse Coding challenges coders to
            reverse‑engineer a given set of inputs and outputs to derive the
            hidden algorithm.
          </li>
          <li>
            <span className="text-[#C9EB3E]">Cryptic Hunt</span> – For those who
            love puzzles, cryptography, and lateral thinking, Cryptic Hunt is
            the perfect challenge. Participants solve a series of
            cryptography‑based coding challenges that require deciphering hidden
            clues, breaking ciphers, and applying logic to progress through
            different levels.
          </li>
          <li>
            <span className="text-[#C9EB3E]">Codex Cryptum</span> – A hybrid
            event combining interactive workshops, coding exercises, and live
            problem‑solving, Codex Cryptum provides an immersive learning
            experience.
          </li>
        </ul>
      </NeonSection>
    </>
  );
};

export default About;
