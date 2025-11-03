"use client";
import { useState } from "react";
import About from "./components/design/about";
import AOIs from "./components/design/aoi";
import DesignNavbar from "./components/design/design-navbar";
import Home from "./components/design/home";
import Instructions from "./components/design/instructions";
import Interview from "./components/design/interview";
import Questions from "./components/design/questions";
import Image from "next/image";
const DesignClient = () => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");

  return (
    <div className="flex flex-col w-full h-full border border-black text-white">
      <Image
        src="/images/design/background.svg"
        alt="About Design"
        width={1920}
        height={1080}
        className="w-full h-full object-cover absolute top-0"
      />
      <Image
        src="/images/design/acmlogo.svg"
        alt="About Design"
        width={400}
        height={400}
        className="w-[15vw] object-cover absolute top-5 left-5 z-30"
      />

      <DesignNavbar selected={selectedPanel} onSelect={setSelectedPanel} />
      <div className="flex overflow-y-auto z-10">
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
