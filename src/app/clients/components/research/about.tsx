"use client";

import NetworkGraph from "./network-graph";

const About = () => {
  return (
    <div className="relative w-full min-h-screen bg-[#1A1A1A] text-white overflow-hidden">
      <NetworkGraph />

      <div className="relative z-10 px-[4vw] py-[5vh] max-w-7xl">
        <h1 className="text-[clamp(2rem,1.5vw,1.25rem)] font-semibold text-[#C8B7FF] mb-[1vh] font-monopoly-bold">
          About Research
        </h1>
        <p className="text-gray-300 leading-relaxed text-justify font-monopoly text-[clamp(1.2rem,1.2vw,1rem)]">
          At ACM-VIT's Research domain, curiosity, collaboration and a passion
          for exploration drive everything we do. From crafting challenges for
          our flagship events to publishing insightful blogs, we turn questions
          into breakthroughs. We also host the System's Reading Group (SRG), a
          peer-led initiative to deep-dive into foundational research. With
          interests spanning{" "}
          <span className="font-bold">
            AI/ML, cybersecurity, quantum computing, blockchain, bioinformatics,
            and IoT
          </span>
          ; we're always pushing boundaries through practical learning and
          discovery.
        </p>
      </div>
    </div>
  );
};

export default About;
