"use client";
import { useState } from "react";
import About from "./components/cc/about";
import Contest from "./components/cc/contest";
import Instructions from "./components/cc/instructions";
import Interview from "./components/cc/interview";
import Homepage from "./components/cc/landing";
import CCNavBar from "./components/cc/navbar";
import Questions from "./components/cc/questions";

const Page = () => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");

  return (
    <div className="w-full h-full relative overflow-y-auto">
      {/* Navbar */}
      <div className="absolute top-[1.2rem] left-0 w-full z-20 flex items-center justify-between px-16">
        <CCNavBar selected={selectedPanel} onSelect={setSelectedPanel} />
      </div>
      {/* Home */}
      {selectedPanel === "Home" && (
        <Homepage onGetStarted={() => setSelectedPanel("About")} />
      )}
      {/* About/Instructions */}
      {selectedPanel !== "Home" && (
        <div className="w-full min-h-full bg-[#121216] pt-28 pb-16">
          <div className="w-full space-y-8 px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32 mt-[45px]">
            {selectedPanel === "About" && <About />}
            {selectedPanel === "Instructions" && <Instructions />}
            {selectedPanel === "Contest" && <Contest />}
            {selectedPanel === "Interview" && <Interview />}
            {selectedPanel === "Questions" && <Questions />}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
