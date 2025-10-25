"use client";

import Image from "next/image";
import { useState } from "react";
import About from "./components/management/about";
import Instructions from "./components/management/instructions";
import QuestionBox from "./components/management/question-box";
import QuestionList from "./components/management/questions-list";
import WhatWeDo from "./components/management/whatwedo";

// ----- Main Page -----
export default function Management() {
  const [activeSection, setActiveSection] = useState("About");

  return (
    <div
      className="min-h-full flex flex-row bg-cover bg-center bg-no-repeat w-full"
      style={{ backgroundImage: "url('/images/red-pattern.jpg')" }}
    >
      {/* Sidebar */}
      <aside className="flex flex-col min-h-full w-[20vw] p-8 text-white">
        <Image
          src="/acmviticon.svg"
          alt="ACM VIT icon"
          width={180}
          height={180}
          className="mb-8"
        />

        <nav className="flex flex-col space-y-4 text-lg">
          {["About", "What we do", "Instructions", "Round 1"].map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`rounded-4xl px-6 py-2 text-left font-medium transition ${
                activeSection === section
                  ? "bg-white/50 text-white drop-shadow-lg/50"
                  : "hover:text-gray-200 hover:bg-white/25 text-white"
              }`}
            >
              {section}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-10 w-full h-[80vh]">
        <div
          style={{ display: activeSection === "About" ? "block" : "none" }}
          className="h-full w-full"
        >
          <About />
        </div>
        <div
          style={{ display: activeSection === "What we do" ? "block" : "none" }}
          className="h-full w-full"
        >
          <WhatWeDo />
        </div>
        <div
          style={{
            display: activeSection === "Instructions" ? "block" : "none",
          }}
          className="h-full w-full"
        >
          <Instructions />
        </div>
        <div
          style={{ display: activeSection === "Round 1" ? "block" : "none" }}
          className="h-full w-full"
        >
          {/* <QuestionList activeSection="Round 1" /> */}
          <QuestionBox />
        </div>
      </main>
    </div>
  );
}
