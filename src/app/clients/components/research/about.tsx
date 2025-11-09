"use client";

import NetworkGraph from "./network-graph";

const About = () => {
  return (
    <div className="relative w-full min-h-screen bg-[#1A1A1A] text-white overflow-hidden">
      <NetworkGraph />

      <div className="relative z-10 px-16 py-20 max-w-7xl">
        <h1 className="text-[20px] font-semibold text-[#C8B7FF] mb-4">
          About Research
        </h1>
        <p className="text-gray-300 leading-relaxed text-justify">
          The Research Domain delves into emerging technologies and innovative
          problem-solving. Members explore areas such as AI/ML, IoT, Blockchain,
          and Quantum Computing, working on projects that connect research with
          real-world applications.
        </p>
      </div>
    </div>
  );
};

export default About;
