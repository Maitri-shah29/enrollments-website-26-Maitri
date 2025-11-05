"use client";
import { useState } from "react";
import About from "@/app/clients/components/research/about";
import AIML from "@/app/clients/components/research/aiml";
import AOIs from "@/app/clients/components/research/aoi";
import Bioinformatics from "@/app/clients/components/research/bioinformatics";
import Blockchain from "@/app/clients/components/research/blockchain";
import Cybersecurity from "@/app/clients/components/research/cybersecurity";
import ResearchHome from "@/app/clients/components/research/home";
import Instructions from "@/app/clients/components/research/instructions";
import Interview from "@/app/clients/components/research/interview";
import IoT from "@/app/clients/components/research/iot";
import QuantumComputing from "@/app/clients/components/research/quantumcomputing";
import Questions from "@/app/clients/components/research/questions";
import ResearchNavbar from "@/app/clients/components/research/research-navbar";

const ResearchClient = () => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");

  return (
    <div className="flex w-full h-full border border-black text-black bg-[#1a1a1a]">
      <ResearchNavbar selected={selectedPanel} onSelect={setSelectedPanel} />

      <div className="flex-1 min-w-0 h-full overflow-auto">
        {selectedPanel === "Home" && <ResearchHome />}
        {selectedPanel === "About" && <About />}
        {selectedPanel === "Instructions" && <Instructions />}
        {selectedPanel === "AOIs" && <AOIs onSelect={setSelectedPanel} />}
        {selectedPanel === "Questions" && <Questions />}
        {selectedPanel === "Interview" && <Interview />}
        {selectedPanel === "AIML" && <AIML />}
        {selectedPanel === "CYBERSECURITY" && <Cybersecurity />}
        {selectedPanel === "BLOCKCHAIN" && <Blockchain />}
        {selectedPanel === "BIOINFORMATICS" && <Bioinformatics />}
        {selectedPanel === "QUANTUMCOMPUTING" && <QuantumComputing />}
        {selectedPanel === "IOT" && <IoT />}
      </div>
    </div>
  );
};

export default ResearchClient;
