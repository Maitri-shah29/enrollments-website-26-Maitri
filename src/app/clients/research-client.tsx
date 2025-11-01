"use client";
import { useState } from "react";
import About from "@/app/clients/components/research/about";
import AOIs from "@/app/clients/components/research/aoi";
import Home from "@/app/clients/components/research/home";
import Instructions from "@/app/clients/components/research/instructions";
import Interview from "@/app/clients/components/research/interview";
import Questions from "@/app/clients/components/research/questions";
import ResearchNavbar from "@/app/clients/components/research/research-navbar";

const ResearchClient = () => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");

  return (
    <div className="flex flex-col w-full h-screen border border-black text-black bg-white">
      <ResearchNavbar selected={selectedPanel} onSelect={setSelectedPanel} />
      <div className="flex-grow overflow-auto">
        {selectedPanel === "Home" && <Home />}
        {selectedPanel === "About" && <About />}
        {selectedPanel === "Instructions" && <Instructions />}
        {selectedPanel === "AOIs" && <AOIs />}
        {selectedPanel === "Questions" && <Questions />}
        {selectedPanel === "Interview" && <Interview />}
      </div>
    </div>
  );
};

export default ResearchClient;
