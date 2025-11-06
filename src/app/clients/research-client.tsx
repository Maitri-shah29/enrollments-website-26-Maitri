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

const AOI_KEYS = [
  "AIML",
  "CYBERSECURITY",
  "BLOCKCHAIN",
  "BIOINFORMATICS",
  "QUANTUMCOMPUTING",
  "IOT",
] as const;
type AoiKey = (typeof AOI_KEYS)[number];

const keyToLabel: Record<AoiKey, string> = {
  AIML: "AI/ML",
  CYBERSECURITY: "Cybersecurity",
  BLOCKCHAIN: "Blockchain",
  BIOINFORMATICS: "Bioinformatics",
  QUANTUMCOMPUTING: "Quantum Computing",
  IOT: "IoT",
};

const labelToKey: Record<string, AoiKey> = Object.fromEntries(
  (Object.keys(keyToLabel) as AoiKey[]).map((k) => [
    keyToLabel[k].toLowerCase(),
    k,
  ]),
) as Record<string, AoiKey>;

function toAoiKey(input: string): AoiKey | null {
  if (!input) return null;
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase().replace(/\s+/g, "");
  const keyMatch = (AOI_KEYS as readonly string[]).find(
    (k) => k === upper || k === trimmed.toUpperCase(),
  ) as AoiKey | undefined;
  if (keyMatch) return keyMatch;

  const labelMatch = labelToKey[trimmed.toLowerCase()];
  return labelMatch ?? null;
}

const ResearchClient = () => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");
  const [selectedAOI, setSelectedAOI] = useState<string>("Blockchain");
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);

  const handleAOISelect = (aoi: string) => {
    const key = toAoiKey(aoi);
    if (key) {
      setSelectedAOI(keyToLabel[key]);
      setSelectedPanel(key);
      setSelectedQuestionIdx(0);
    } else {
      setSelectedPanel("AOIs");
    }
  };

  const handleQuestionSelect = (idx: number) => {
    setSelectedQuestionIdx(idx);
    setSelectedPanel("Round 1");
  };

  const handlePanelSelect = (panelName: string) => {
    const key = toAoiKey(panelName);
    if (key) {
      setSelectedAOI(keyToLabel[key]);
      setSelectedQuestionIdx(0);
      setSelectedPanel(key);
      return;
    }

    setSelectedPanel(panelName);
  };

  return (
    <div className="flex h-full w-full bg-[#1a1a1a]">
      <ResearchNavbar
        selected={selectedPanel}
        onSelect={handlePanelSelect}
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
