"use client";

import NetworkGraph from "./network-graph";

const About = () => {
  return (
    <div className="relative w-full min-h-screen bg-[#1A1A1A] text-white overflow-hidden">
      <NetworkGraph />

      <div className="relative z-10 px-16 py-20 max-w-7xl">
        <h1 className="text-[20px] font-semibold text-[#C8B7FF] mb-4 font-monopoly-bold">
          About Research
        </h1>
        <p className="text-gray-300 leading-relaxed text-justify font-monopoly">
          The Research domain of ACM-VIT is dedicated to fostering an
          environment of curiosity and innovation. We explore multiple areas of
          interest ranging from Artificial Intelligence and Blockchain to
          Quantum Computing and Bioinformatics. Our goal is to bridge theory and
          real-world application through collaboration and continuous learning.
        </p>
      </div>
    </div>
  );
};

export default About;
