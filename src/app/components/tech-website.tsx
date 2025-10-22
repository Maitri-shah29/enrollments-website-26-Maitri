"use client";
import Image from "next/image";
import React, { useState } from "react";
// biome-ignore lint/a11y/useSemanticElements: using div for clickable layout
const TechWebsite = () => {
  const [activeSection, setActiveSection] = useState("welcome");
  const [activeAOI, setActiveAOI] = useState<string>("app");
  const [activeQuestion, setActiveQuestion] = useState<string>("question1");

  const aoiList = ["app", "web", "gamedev", "foss"];
  const questionsList = ["question1", "question2", "question3", "question4"];

  const renderContent = () => {
    if (activeSection === "about") {
      return (
        <div className="bg-[#08111D] p-4 rounded-lg">
          <Image
            src="/images/about-tech.svg"
            alt="acm logo"
            width={5000}
            height={5000}
          />
          <div className="flex text-[#993C7A] font-mono text-lg leading-relaxed mt-15">
            <pre className="text-right pr-4 select-none text-[#993C7A]">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </pre>

            <pre className="text-white whitespace-pre-wrap">
              {`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate.`}
            </pre>
          </div>
        </div>
      );
    }

    if (activeSection === "aoi") {
      if (activeAOI) {
        const aoiData: Record<
          string,
          { text: string; image: string; width: number; height: number }
        > = {
          app: {
            text: `The App Development domain focuses on building robust mobile and desktop applications. Members learn technologies like React Native, Flutter, and Kotlin to design apps that are user-centric and scalable.`,
            image: "/images/tech-aois/app.svg",
            width: 500,
            height: 500,
          },
          web: {
            text: `The Web Development domain emphasizes creating full-stack web solutions. Participants gain skills in frameworks like Next.js, Express, and databases like PostgreSQL and MongoDB to build high-performance, modern websites.`,
            image: "/images/tech-aois/web.svg",
            width: 500,
            height: 500,
          },
          gamedev: {
            text: `The Game Development domain brings creativity and logic together. Developers explore Unity, Unreal Engine, and Godot to create immersive experiences, learning both design and real-time rendering techniques.`,
            image: "/images/tech-aois/gamedev.svg",
            width: 800,
            height: 800,
          },
          foss: {
            text: `The FOSS (Free and Open Source Software) domain nurtures collaborative software development. Students contribute to open-source projects on GitHub, learning version control, documentation, and large-scale code management.`,
            image: "/images/tech-aois/foss.svg",
            width: 600,
            height: 600,
          },
        };

        const aoi = aoiData[activeAOI];
        const numLines = aoi.text.split(".").length + 1;

        return (
          <div className="text-[#993C7A] text-2xl font-semibold flex items-center flex-col">
            <Image
              src={aoi.image}
              alt={`${activeAOI} logo`}
              width={aoi.width}
              height={aoi.height}
              className="mt-5"
            />
            <div className="flex text-[#993C7A] font-mono text-lg leading-relaxed mt-15">
              <pre className="text-right pr-4 select-none text-[#993C7A]">
                {Array.from({ length: numLines }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </pre>

              <pre className="whitespace-pre-wrap text-[#E097CE] max-w-4xl">
                {aoi.text}
              </pre>
            </div>
          </div>
        );
      }

      return (
        <div className="text-[#993C7A] text-2xl font-semibold">
          <h1>Areas of Interest</h1>
          <p className="mt-4 text-lg text-white">
            Select a subtopic from the sidebar to view more details.
          </p>
        </div>
      );
    }

    if (activeSection === "instructions") {
      return (
        <div className="text-[#993C7A] text-2xl">
          <Image
            src="/images/tech-instructions.svg"
            alt="acm logo"
            width={5000}
            height={5000}
          />
          <div className="flex text-[#993C7A] font-mono text-lg leading-relaxed mt-15">
            <pre className="text-right pr-4 select-none text-[#993C7A]">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </pre>
            <pre className="whitespace-pre-wrap text-[#E097CE]">
              {`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate.`}
            </pre>
          </div>
        </div>
      );
    }

    if (activeSection === "round1") {
      if (activeQuestion) {
        return (
          <div className="text-[#993C7A] text-2xl font-semibold">
            <h1>{activeQuestion}</h1>
            <p className="mt-4 text-lg text-white max-w-2xl text-justify">
              This is the content area for{" "}
              <span className="text-[#993C7A]">{activeQuestion}</span>. You can
              display the question prompt, input fields, or upload sections
              here.
            </p>
          </div>
        );
      }
      return (
        <div className="text-[#993C7A] text-2xl font-semibold">
          <h1>Round 1 Overview</h1>
          <p className="mt-4 text-lg text-white">
            Choose a question from the sidebar to get started.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden">
        <Image
          src="/images/ascii-art-tech.svg"
          alt="tech image"
          width={500}
          height={500}
          className="absolute bottom-10 right-10"
        />
        <Image
          src="/images/welcome-tech.svg"
          alt="welcome image"
          width={5000}
          height={5000}
        />
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-[#08111D] flex font-jetbrains">
      <div className="w-[20%] border-r-2 border-[#993C7A] h-full p-3 overflow-y-auto font-jetbrains">
        <Image
          src="/images/acmlogo.svg"
          alt="acm logo"
          width={5000}
          height={5000}
          className="hover:cursor-pointer"
          onClick={() => setActiveSection("welcome")}
        />
        <div className="w-full h-fit mt-5 font-jetbrains">
          {[
            { name: "About", key: "about" },
            { name: "AOI", key: "aoi" },
            { name: "Instructions", key: "instructions" },
            { name: "Round 1", key: "round1" },
          ].map((item, index) => (
            <React.Fragment key={index}>
              <div
                onClick={() => {
                  setActiveSection(item.key);
                  if (item.key === "aoi" && !activeAOI) setActiveAOI("app");
                  if (item.key === "round1" && !activeQuestion)
                    setActiveQuestion("question1");
                }}
                className={`border-t-2 ${
                  index === 3 ? "border-b-2" : ""
                } border-[#993C7A] h-15 text-xl flex items-center cursor-pointer gap-3 px-2 transition-all duration-200 ${
                  activeSection === item.key
                    ? "bg-[#993C7A]/20 text-white"
                    : "text-[#993C7A] hover:bg-[#993C7A]/10"
                }`}
              >
                <Image
                  src="/images/folder.svg"
                  alt={`${item.name} icon`}
                  width={40}
                  height={40}
                />
                {item.name}
              </div>

              {item.key === "aoi" && activeSection === "aoi" && (
                <div className="ml-8 mt-2 flex flex-col gap-2 text-[#993C7A]">
                  {aoiList.map((aoi, idx) => {
                    const isActive = activeAOI === aoi;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveAOI(aoi)}
                        className={`cursor-pointer transition-all gap-4 flex items-center duration-150 text-md mb-2 ${
                          isActive ? "text-white" : "hover:text-white/80"
                        }`}
                      >
                        <Image
                          src={
                            isActive
                              ? "/images/selected-folder.svg"
                              : "/images/unselected-folder.svg"
                          }
                          alt={`${aoi} icon`}
                          width={25}
                          height={25}
                        />
                        {aoi}
                      </div>
                    );
                  })}
                </div>
              )}

              {item.key === "round1" && activeSection === "round1" && (
                <div className="ml-8 mt-2 flex flex-col gap-2 text-[#993C7A]">
                  {questionsList.map((q, idx) => {
                    const isActive = activeQuestion === q;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveQuestion(q)}
                        className={`cursor-pointer transition-all duration-150 text-md mb-2 flex items-center gap-3 ${
                          isActive ? "text-white" : "hover:text-white/80"
                        }`}
                      >
                        <Image
                          src={
                            isActive
                              ? "/images/selected-folder.svg"
                              : "/images/unselected-folder.svg"
                          }
                          alt={`${q} icon`}
                          width={25}
                          height={25}
                        />
                        {q}
                      </div>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="w-full h-full p-7 relative font-jetbrains">
        <div className="w-full h-full border-2 border-[#993C7A] flex flex-col justify-center items-center p-10 relative overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default TechWebsite;
