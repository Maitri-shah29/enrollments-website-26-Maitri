"use client";

import Image from "next/image";
import { useState } from "react";
import About from "./components/management/about";
import Instructions from "./components/management/instructions";
import QuestionList from "./components/management/questions-list";
import WhatWeDo from "./components/management/whatwedo";

export default function Management() {
  const [activeSection, setActiveSection] = useState("About");

  return (
    <div
      className="h-full flex flex-row bg-cover bg-center bg-no-repeat w-full overflow-x-hidden"
      style={{ backgroundImage: "url('/images/red-pattern.jpg')" }}
    >
      {/* Sidebar */}
      <aside className="flex flex-col h-full w-[20vw] p-8 text-white">
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
      <main className="flex-1 flex justify-center items-center px-8">
        {activeSection !== "Round 1" && (
          <div className="h-[90%] w-full flex items-center justify-center">
            {activeSection === "About" && <About />}
            {activeSection === "What we do" && <WhatWeDo />}
            {activeSection === "Instructions" && <Instructions />}
          </div>
        )}
        {/* So that it doesn't unmount after first load */}
        <div
          className={
            activeSection === "Round 1"
              ? "block h-[90%] w-full flex items-center justify-center"
              : "hidden"
          }
        >
          <QuestionList activeSection={activeSection} />
        </div>
      </main>
    </div>
  );
}
