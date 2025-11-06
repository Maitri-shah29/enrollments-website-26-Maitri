"use client";

import NetworkGraph from "./network-graph";

const About = () => {
  return (
    <div className="relative w-full min-h-screen bg-[#0E0E0E] text-white overflow-hidden">
      <NetworkGraph />

      <div className="relative z-10 px-16 py-20 max-w-5xl">
        <h1 className="text-4xl font-semibold text-purple-400 mb-4">
          About Research
        </h1>
        <p className="text-gray-300 leading-relaxed text-justify">
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
