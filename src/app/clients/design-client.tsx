"use client";
import { useState } from "react";
import About from "./components/design/about";
import AOIs from "./components/design/aoi";
import DesignNavbar from "./components/design/design-navbar";
import Home from "./components/design/home";
import Instructions from "./components/design/instructions";
import Interview from "./components/design/interview";
import Questions from "./components/design/questions";

const DesignClient = () => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");

  return (
    <div className="flex flex-col w-full h-screen border border-black text-black bg-white">
      <DesignNavbar selected={selectedPanel} onSelect={setSelectedPanel} />
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

export default DesignClient;
