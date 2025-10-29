"use client";
import { useCallback, useState } from "react";
import type { AOI, QuestionId } from "@/lib/types";

export type Section = "welcome" | "about" | "aoi" | "instructions" | "round1";

export function useTechNavigation() {
  const [activeSection, setActiveSection] = useState<Section>("welcome");
  const [aoiExpanded, setAoiExpanded] = useState(false);
  const [roundExpanded, setRoundExpanded] = useState(false);
  const [activeAOI, setActiveAOI] = useState<AOI>("app");
  const [activeRoundFolder, setActiveRoundFolder] = useState<AOI | "">("");
  const [activeQuestion, setActiveQuestion] = useState<QuestionId | "">(
    "question1",
  );

  const setSection = useCallback((s: Section) => {
    setActiveSection(s);
  }, []);

  const toggleAoi = useCallback(() => {
    setAoiExpanded((prev) => !prev);
    setActiveSection("aoi");
    setActiveAOI((prev) => prev || "app");
  }, []);

  const toggleRound = useCallback(() => {
    setRoundExpanded((prev) => !prev);
    setActiveSection("round1");
    setActiveRoundFolder("");
    setActiveQuestion("");
  }, []);

  const selectAoi = useCallback((aoi: AOI) => {
    setActiveAOI(aoi);
    setActiveSection("aoi");
  }, []);

  const selectFolder = useCallback((folder: AOI) => {
    setActiveSection("round1");
    setActiveQuestion("");
    setActiveRoundFolder((prev) => (prev === folder ? "" : folder));
  }, []);

  const selectQuestion = useCallback((q: QuestionId) => {
    setActiveSection("round1");
    setActiveQuestion(q);
  }, []);

  const resetRound1 = useCallback(() => {
    setActiveRoundFolder("");
    setActiveQuestion("");
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
