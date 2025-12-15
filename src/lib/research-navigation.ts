"use client";
import { useCallback, useState } from "react";

export type ResearchAOI =
  | "aiml"
  | "cybersecurity"
  | "blockchain"
  | "bioinformatics"
  | "quantumcomputing"
  | "iot";

export type ResearchSection =
  | "home"
  | "about"
  | "aoi"
  | "explore"
  | "instructions"
  | "round1"
  | "interview";

export function useResearchNavigation() {
  const [activeSection, setActiveSection] = useState<ResearchSection>("home");
  const [aoiExpanded, setAoiExpanded] = useState(false);
  const [roundExpanded, setRoundExpanded] = useState(false);
  const [activeAOI, setActiveAOI] = useState<ResearchAOI>("aiml");
  const [activeRoundFolder, setActiveRoundFolder] = useState<
    ResearchAOI | "common" | ""
  >("");
  const [activeQuestion, setActiveQuestion] = useState<number>(0);

  const setSection = useCallback((s: ResearchSection) => {
    setActiveSection(s);
  }, []);

  const toggleAoi = useCallback(() => {
    setAoiExpanded((prev) => !prev);
    setActiveSection("aoi");
    setActiveAOI((prev) => prev || "aiml");
  }, []);

  const toggleRound = useCallback(() => {
    setRoundExpanded((prev) => !prev);
    setActiveSection("round1");
    setActiveRoundFolder("");
    setActiveQuestion(0);
  }, []);

  const selectAoi = useCallback((aoi: ResearchAOI) => {
    setActiveAOI(aoi);
    setActiveSection("aoi");
  }, []);

  const selectFolder = useCallback((folder: ResearchAOI | "common") => {
    setActiveSection("round1");
    setActiveQuestion(0);
    setActiveRoundFolder((prev) => (prev === folder ? "" : folder));
  }, []);

  const selectQuestion = useCallback((idx: number) => {
    setActiveSection("round1");
    setActiveQuestion(idx);
  }, []);

  const resetRound1 = useCallback(() => {
    setActiveRoundFolder("");
    setActiveQuestion(0);
  }, []);

  return {
    activeSection,
    aoiExpanded,
    roundExpanded,
    activeAOI,
    activeRoundFolder,
    activeQuestion,
    setSection,
    toggleAoi,
    toggleRound,
    selectAoi,
    selectFolder,
    selectQuestion,
    resetRound1,
    setAoiExpanded,
    setRoundExpanded,
  };
}
