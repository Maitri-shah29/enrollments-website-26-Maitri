"use client";
import { useState } from "react";
import About from "@/app/clients/components/research/about";
import AOIs from "@/app/clients/components/research/aoi";
import ResearchHome from "@/app/clients/components/research/home";
import Instructions from "@/app/clients/components/research/instructions";
import Interview from "@/app/clients/components/research/interview";
import Questions from "@/app/clients/components/research/questions";
import ResearchNavbar from "@/app/clients/components/research/research-navbar";

const ResearchClient = () => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");

  return (
<<<<<<< Updated upstream
    <div className="flex w-full h-screen overflow-hidden bg-[#0A0A0F]">
=======
    <div className="flex flex-col w-full h-full border border-black text-black bg-[#1a1a1a]">
>>>>>>> Stashed changes
      <ResearchNavbar selected={selectedPanel} onSelect={setSelectedPanel} />

      <div className="flex-1 min-w-0 h-full overflow-auto">
        {selectedPanel === "Home" && <ResearchHome />}
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
