"use client";
import { useState } from "react";
import About from "@/app/clients/components/research/about";
import AOIs from "@/app/clients/components/research/aoi";
import AIML from "@/app/clients/components/research/aoi-pages/aiml";
import Bioinformatics from "@/app/clients/components/research/aoi-pages/bioinformatics";
import Blockchain from "@/app/clients/components/research/aoi-pages/blockchain";
import Cybersecurity from "@/app/clients/components/research/aoi-pages/cybersecurity";
import IoT from "@/app/clients/components/research/aoi-pages/iot";
import QuantumComputing from "@/app/clients/components/research/aoi-pages/quantumcomputing";
import ResearchHome from "@/app/clients/components/research/home";
import Instructions from "@/app/clients/components/research/instructions";
import Interview from "@/app/clients/components/research/interview";
import Questions from "@/app/clients/components/research/questions";
import ResearchNavbar from "@/app/clients/components/research/research-navbar";

const ResearchClient = () => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");
  const [selectedAOI, setSelectedAOI] = useState<string>("Blockchain");
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);

  const handleAOISelect = (aoi: string) => {
    setSelectedAOI(aoi);
    setSelectedQuestionIdx(0);
    setSelectedPanel("Round 1");
  };

  const handleQuestionSelect = (idx: number) => {
    setSelectedQuestionIdx(idx);
    setSelectedPanel("Round 1");
  };

  const handlePanelSelect = (panelName: string) => {
    const aoiMap: Record<string, string> = {
      BLOCKCHAIN: "Blockchain",
      QUANTUMCOMPUTING: "Quantum Computing",
      AIML: "AI/ML",
      BIOINFORMATICS: "BioInformatics",
      CYBERSECURITY: "Cyber Security",
      IOT: "IoT",
    };

    if (aoiMap[panelName]) {
      setSelectedAOI(aoiMap[panelName]);
      setSelectedQuestionIdx(0);
      setSelectedPanel("Round 1");
    } else {
      setSelectedPanel(panelName);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#1a1a1a]">
      <ResearchNavbar
        selected={selectedPanel}
        onSelect={setSelectedPanel}
        selectedAOI={selectedAOI}
        selectedQuestionIdx={selectedQuestionIdx}
        onAOISelect={handleAOISelect}
        onQuestionSelect={handleQuestionSelect}
      />

      <div className="flex-1 min-w-0 h-full overflow-hidden">
        {selectedPanel === "Home" && <ResearchHome />}
        {selectedPanel === "About" && <About />}
        {selectedPanel === "Instructions" && <Instructions />}
        {selectedPanel === "AOIs" && <AOIs onSelect={handlePanelSelect} />}
        {selectedPanel === "Round 1" && (
          <Questions
            selectedAOI={selectedAOI}
            selectedQuestionIdx={selectedQuestionIdx}
            onAOIChange={setSelectedAOI}
            onQuestionChange={setSelectedQuestionIdx}
          />
        )}
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
