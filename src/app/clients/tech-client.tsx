"use client";
import Image from "next/image";
import React, { useState } from "react";
import { asciiArt } from "./components/tech/ascii-art";
// biome-ignore lint/a11y/useSemanticElements: using div for clickable layout
const TechWebsite = () => {
  const [activeSection, setActiveSection] = useState("welcome");
  const [activeAOI, setActiveAOI] = useState<string>("app");
  const [activeQuestion, setActiveQuestion] = useState<string>("question1");
  const [activeRound1Folder, setActiveRound1Folder] = useState<string>('');
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const questionsData: Record<
    string,
    Record<number, { title: string; description: string }>
  > = {
    app: {
      1: {
        title: 'bla bla',
        description:
          'shshshshhhshsh question details here',
      },
      2: {
        title: 'bla bla bla',
        description:
          'shshshshhhshsh question details here',
      },
      // Add more questions for app...
    },
    web: {
      1: {
        title: 'bla bla bla',
        description:
          'shshshshhhshsh question details here',
      },
      2: {
        title: 'bla bla bla',
        description:
          'shshshshhhshsh question details here',
      },
      // Add more questions for web...
    },
    gamedev: {
      1: {
        title: 'bla bla',
        description:
          'shshshshhhshsh question details here',
      },
      // Add more questions for gamedev...
    },
    foss: {
      1: {
        title: 'bla bla',
        description:
          'shshshshhhshsh question details here',
      },
      // Add more questions for foss...
    },
  };

  const aoiList = ["app", "web", "gamedev", "foss"];
  const questionsList = ['question1', 'question2','question3','question4','question5','question6','question7','question8', 'question9','question10'];
  const round1Folders = ['app', 'web', 'gamedev', 'foss'];


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

    if (activeSection === 'round1') {
      if (activeRound1Folder && activeQuestion) {
        const questionNumber = Number(activeQuestion.replace('question', ''));
        const questionKey = `${activeRound1Folder}-${activeQuestion}`;
        const isSubmitted = submittedQuestions.has(questionKey);

        const currentQuestion =
          questionsData[activeRound1Folder]?.[questionNumber];
        const questionTitle =
          currentQuestion?.title || `Question ${questionNumber}`;
        const questionDescription =
          currentQuestion?.description ||
          'No description available for this question.';

        return (
          <div className="w-full h-full relative">
            <pre className="text-white font-mono text-sm leading-tight mb-8">
              {asciiArt[questionNumber] || `Question ${questionNumber}`}
            </pre>
            
            <div className="mt-8">
              <div className="text-[#993C7A] font-jetbrains text-sm mb-2">
                q{questionNumber}:\{questionTitle}
              </div>
              <div className="text-[#993C7A] font-jetbrains text-sm leading-relaxed px-20 mb-4">
                {questionDescription.split('\n').map((line, idx) => (
                  <div key={idx}>
                    <span className="text-[#993C7A] ">&gt;</span> {line}
                  </div>
                ))}
              </div>
                <div className="text-[#993C7A] font-jetbrains text-sm mb-2">
                q{questionNumber}:\ans
                </div>

                <div className="mb-8 px-18">
                <textarea
                  className={`w-full h-32 bg-transparent text-[#E097CE] font-jetbrains text-sm p-3 resize-none focus:outline-none focus:border-white transition-colors ${isSubmitted}`}
                  placeholder={
                  isSubmitted
                    ? 'Answer submitted'
                    : 'Type your answer here...'
                  }
                  value={answers[questionKey] || ''}
                  onChange={(e) => {
                  if (!isSubmitted) {
                    setAnswers((prev) => ({
                    ...prev,
                    [questionKey]: e.target.value,
                    }));
                  }
                  }}
                  onFocus={(e) => {
                  if (!isSubmitted && !answers[questionKey]) {
                    setAnswers((prev) => ({
                    ...prev,
                    [questionKey]: '> ',
                    }));
                    setTimeout(() => {
                      e.target.selectionStart = e.target.selectionEnd = 2;
                    }, 0);
                  }
                  }}
                  disabled={isSubmitted}
                  readOnly={isSubmitted}
                />
                </div>

              <div className="flex justify-end">
                <button
                  className={`bg-transparent border px-10 py-2 mt-6 font-jetbrains text-sm transition-colors ${
                    isSubmitted
                      ? 'border-gray-500 text-gray-500 cursor-not-allowed'
                      : 'border-[#993C7A] hover:bg-[#993C7A]'
                  }`}
                  onClick={() => {
                    if (!isSubmitted && answers[questionKey]?.trim()) {
                      setSubmittedQuestions(
                        (prev) => new Set([...prev, questionKey])
                      );
                      console.log(
                        'Answer submitted for question',
                        questionNumber,
                        ':',
                        answers[questionKey]
                      );
                    }
                  }}
                  disabled={isSubmitted || !answers[questionKey]?.trim()}
                >
                  {isSubmitted ? 'submitted' : 'submit'}
                </button>
              </div>
            </div>
          </div>
        );
      }
      if (activeRound1Folder) {
        return (
          <div className="text-[#993C7A] text-2xl font-semibold">
            <h1>{activeRound1Folder} </h1>
            <p className="mt-4 text-lg text-white">
              Select a question to get started with{' '}
              {activeRound1Folder}.
            </p>
          </div>
        );
      }
      return (
        <div className="text-[#993C7A] text-2xl font-semibold">
          <h1>Round 1 Overview</h1>
          <p className="mt-4 text-lg text-white">
            Choose a folder from the sidebar to get started.
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
    <div className="w-full h-full bg-[#08111D] flex font-jetbrains [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-[#08111D] [&::-webkit-scrollbar-thumb]:bg-[#993C7A] [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-[#08111D] [&::-webkit-scrollbar-thumb:hover]:bg-[#b84a92]">
      <div className="w-[20%] overflow-hidden border-r-2 border-[#993C7A] h-full p-3 overflow-y-auto font-jetbrains [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-[#08111D] [&::-webkit-scrollbar-thumb]:bg-[#993C7A] [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-[#08111D] [&::-webkit-scrollbar-thumb:hover]:bg-[#b84a92]">
        <Image
          src="/images/acmlogo.svg"
          alt="acm logo"
          width={5000}
          height={5000}
          className="hover:cursor-pointer"
          onClick={() => setActiveSection('welcome')}
        />
        <div className="w-full h-fit mt-5 font-jetbrains">
          {[
            { name: 'About', key: 'about' },
            { name: 'AOI', key: 'aoi' },
            { name: 'Instructions', key: 'instructions' },
            { name: 'Round 1', key: 'round1' },
          ].map((item, index) => (
            <React.Fragment key={index}>
              <div
                onClick={() => {
                  setActiveSection(item.key);
                  if (item.key === 'aoi' && !activeAOI) setActiveAOI('app');
                  if (item.key === 'round1') {
                    setActiveRound1Folder('');
                    setActiveQuestion('');
                  }
                }}
                className={`border-t-2 ${
                  index === 3 ? 'border-b-2' : ''
                } border-[#993C7A] h-15 text-xl flex items-center cursor-pointer gap-3 px-2 transition-all duration-200 ${
                  activeSection === item.key
                    ? 'bg-[#993C7A]/20 text-white'
                    : 'text-[#993C7A] hover:bg-[#993C7A]/10'
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

              {item.key === 'aoi' && activeSection === 'aoi' && (
                <div className="ml-8 mt-2 flex flex-col gap-2 text-[#993C7A]">
                  {aoiList.map((aoi, idx) => {
                    const isActive = activeAOI === aoi;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveAOI(aoi)}
                        className={`cursor-pointer transition-all gap-4 flex items-center duration-150 text-md mb-2 ${
                          isActive ? 'text-white' : 'hover:text-white/80'
                        }`}
                      >
                        <Image
                          src={
                            isActive
                              ? '/images/selected-folder.svg'
                              : '/images/unselected-folder.svg'
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

              {item.key === 'round1' && activeSection === 'round1' && (
                <div className="ml-8 mt-2 flex flex-col gap-2 text-[#993C7A]">
                  {round1Folders.map((folder, idx) => {
                    const isFolderActive = activeRound1Folder === folder;
                    return (
                      <React.Fragment key={idx}>
                        <div
                          onClick={() => {
                            setActiveRound1Folder(folder);
                            setActiveQuestion(''); 
                          }}
                          className={`cursor-pointer transition-all duration-150 text-md mb-2 flex items-center gap-3 ${
                            isFolderActive
                              ? 'text-white'
                              : 'hover:text-white/80'
                          }`}
                        >
                          <Image
                            src={
                              isFolderActive
                                ? '/images/selected-folder.svg'
                                : '/images/unselected-folder.svg'
                            }
                            alt={`${folder} icon`}
                            width={25}
                            height={25}
                          />
                          {folder}
                        </div>

                        {isFolderActive && (
                          <div className="ml-8 mt-2 flex flex-col gap-2 text-[#993C7A]">
                            {questionsList.map((q, qIdx) => {
                              const isQuestionActive = activeQuestion === q;
                              const questionKey = `${folder}-${q}`;
                              const isQuestionSubmitted = submittedQuestions.has(questionKey);
                              return (
                                <div
                                  key={qIdx}
                                  onClick={() => setActiveQuestion(q)}
                                  className={`cursor-pointer transition-all duration-150 text-sm mb-2 flex items-center gap-3 ${
                                    isQuestionActive
                                      ? 'text-white'
                                      : 'hover:text-white/80'
                                  }`}
                                >
                                  <Image
                                    src={
                                      isQuestionActive || isQuestionSubmitted
                                        ? '/images/selected-folder.svg'
                                        : '/images/unselected-folder.svg'
                                    }
                                    alt={`${q} icon`}
                                    width={20}
                                    height={20}
                                  />
                                  {q}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </React.Fragment>
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