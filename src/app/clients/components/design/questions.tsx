"use client";
import type React from "react";
import { useState } from "react";

const Questions: React.FC = () => {
  const aoiData = [
    {
      name: "UI/UX",
      questions: [
        {
          header: "Question 1",
          content: "What is the difference between UI and UX?",
        },
        {
          header: "Question 2",
          content: "Explain the concept of user-centered design.",
        },
        {
          header: "Question 3",
          content: "What are wireframes and prototypes?",
        },
        {
          header: "Question 4",
          content: "Describe the user persona and its purpose.",
        },
        { header: "Question 5", content: "What is a usability test?" },
        {
          header: "Question 6",
          content: "Explain Jakob's Law of Internet User Experience.",
        },
        { header: "Question 7", content: "What is information architecture?" },
        {
          header: "Question 8",
          content: "Describe the Fitt's Law in UI design.",
        },
        {
          header: "Question 9",
          content: "What are design systems and why are they useful?",
        },
        {
          header: "Question 10",
          content: "Explain the concept of responsive vs. adaptive design.",
        },
      ],
    },
    {
      name: "Video Editing",
      questions: [
        {
          header: "Question 1",
          content: "What is a jump cut and how is it used?",
        },
        { header: "Question 2", content: "Explain the 180-degree rule." },
        {
          header: "Question 3",
          content: "What is the difference between an L-cut and a J-cut?",
        },
        {
          header: "Question 4",
          content: "Describe the purpose of color grading.",
        },
        {
          header: "Question 5",
          content: "What is a non-linear editing (NLE) system?",
        },
        { header: "Question 6", content: "What are codecs and containers?" },
        {
          header: "Question 7",
          content: "Explain the concept of 'pacing' in editing.",
        },
        { header: "Question 8", content: "What is a montage sequence?" },
        {
          header: "Question 9",
          content: "What is the difference between 4K and 1080p resolution?",
        },
        {
          header: "Question 10",
          content: "Explain the use of Foley in video production.",
        },
      ],
    },
    {
      name: "Motion Graphics",
      questions: [
        {
          header: "Question 1",
          content: "What are keyframes and how do they work?",
        },
        {
          header: "Question 2",
          content: "Difference between After Effects and Premiere Pro.",
        },
        {
          header: "Question 3",
          content: "What are the 12 Principles of Animation?",
        },
        {
          header: "Question 4",
          content: "Explain what 'easing' is in motion design.",
        },
        {
          header: "Question 5",
          content: "What is a vector graphic and why is it useful in motion?",
        },
        {
          header: "Question 6",
          content: "Describe the purpose of a storyboard in motion graphics.",
        },
        { header: "Question 7", content: "What is rotoscoping?" },
        {
          header: "Question 8",
          content: "Explain the difference between 2D and 3D animation.",
        },
        { header: "Question 9", content: "What is kinetic typography?" },
        { header: "Question 10", content: "What is a 'lower third'?" },
      ],
    },
    {
      name: "Illustrations",
      questions: [
        {
          header: "Question 1",
          content: "Vector vs. Raster: What's the difference?",
        },
        {
          header: "Question 2",
          content: "What is the golden ratio and how is it used in art?",
        },
        {
          header: "Question 3",
          content: "Explain the principles of color theory.",
        },
        {
          header: "Question 4",
          content: "What is 'line weight' and why is it important?",
        },
        {
          header: "Question 5",
          content: "Describe the difference between CMYK and RGB color modes.",
        },
        { header: "Question 6", content: "What is perspective in drawing?" },
        {
          header: "Question 7",
          content: "Explain 'composition' in the context of illustration.",
        },
        { header: "Question 8", content: "What is a thumbnail sketch?" },
        { header: "Question 9", content: "What are complementary colors?" },
        {
          header: "Question 10",
          content: "What is typography and its role in illustration?",
        },
      ],
    },
    {
      name: "3D Graphics",
      questions: [
        { header: "Question 1", content: "Explain polygon modeling." },
        {
          header: "Question 2",
          content: "What is UV unwrapping and why is it necessary?",
        },
        {
          header: "Question 3",
          content:
            "Describe the difference between a bump map and a normal map.",
        },
        { header: "Question 4", content: "What is rigging in 3D animation?" },
        {
          header: "Question 5",
          content: "Explain the concept of PBR (Physically Based Rendering).",
        },
        { header: "Question 6", content: "What is 3D sculpting?" },
        { header: "Question 7", content: "What is 'topology' in a 3D model?" },
        {
          header: "Question 8",
          content: "Describe the 3D production pipeline.",
        },
        { header: "Question 9", content: "What is ray tracing?" },
        {
          header: "Question 10",
          content:
            "Explain the difference between global and local illumination.",
        },
      ],
    },
  ];

  const [selectedAoi, setSelectedAoi] = useState(aoiData[0]);
  const [selectedQuestion, setSelectedQuestion] = useState(
    aoiData[0].questions[0],
  );

  const handleAoiClick = (aoi: (typeof aoiData)[0]) => {
    setSelectedAoi(aoi);
    setSelectedQuestion(aoi.questions[0]);
  };

  return (
    <div className="h-full w-full flex items-center justify-start flex-col px-[5%] py-[3%] overflow-y-auto">
      <h1 className="text-[8vh] lg:text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0 mb-[3%] mt-[2%]">
        Questions
      </h1>
      <div className="flex flex-col lg:flex-row w-full px-[3%] gap-[3%]">
        <div className="w-full lg:w-[25%] mb-[3%] lg:mb-0">
          <div className="relative mb-4 lg:mb-8">
            <div className="absolute bottom-[-10px] right-[-10px] w-full h-full rounded-xl border-2 border-[#43A363]/60"></div>
            <div className="bg-[#43A363] p-4 lg:p-6 rounded-xl flex flex-col gap-2">
              {aoiData.map((aoi) => (
                <div
                  className="flex gap-3 lg:gap-5 items-center cursor-pointer z-100"
                  key={aoi.name}
                  onClick={() => handleAoiClick(aoi)}
                >
                  <div
                    className={`w-4 lg:w-6 aspect-square rounded-sm ${
                      selectedAoi.name === aoi.name
                        ? "bg-[#1A1A1A]"
                        : "bg-white"
                    }`}
                  ></div>
                  <p
                    className={`font-georgia text-[clamp(0.875rem,1vw,1rem)] truncate ${
                      selectedAoi.name === aoi.name ? "font-bold" : ""
                    }`}
                  >
                    {aoi.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute bottom-[-10px] right-[-10px] w-full h-full rounded-xl border-2 border-[#3389E5]/60"></div>
            <div className="bg-[#3389E5] p-4 lg:p-8 rounded-xl flex flex-col gap-2">
              {selectedAoi.questions.map((question) => (
                <div
                  className="flex gap-3 lg:gap-5 items-center cursor-pointer z-100"
                  key={question.header}
                  onClick={() => setSelectedQuestion(question)}
                >
                  <div
                    className={`w-4 lg:w-6 aspect-square rounded-sm ${
                      selectedQuestion.header === question.header
                        ? "bg-[#1A1A1A]"
                        : "bg-white"
                    }`}
                  ></div>
                  <p
                    className={`font-georgia text-[clamp(0.875rem,1vw,1rem)] truncate ${
                      selectedQuestion.header === question.header
                        ? "font-bold"
                        : ""
                    }`}
                  >
                    {question.header}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:flex-1 min-h-[60vh] lg:min-h-0 bg-[#302E2E] rounded-xl p-6 lg:p-10 text-white flex flex-col">
          {selectedQuestion ? (
            <div className="flex flex-col flex-1">
              <h2 className="text-lg lg:text-xl font-georgia mb-1 font-bold text-[#EA86B5]">
                {selectedQuestion.header}
              </h2>
              <p className="text-base lg:text-lg font-georgia">
                {selectedQuestion.content}
              </p>
              <div className="h-[1px] my-3 lg:my-5 w-full bg-white"></div>
              <h2 className="text-lg lg:text-xl font-georgia mb-1 font-bold text-[#EA86B5]">
                Answer
              </h2>

              <div className="flex-1 min-h-[200px]">
                <textarea
                  className="
                        w-full h-full
                        resize-none
                        bg-transparent
                        font-georgia
                        text-white
                        text-sm lg:text-base
                        outline-none
                        border-none
                        selection:bg-transparent selection:text-[#EA86B5]
                      "
                  placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate. "
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  className="px-6 lg:px-10 py-3 lg:py-4 border-2 border-white font-georgia rounded-lg text-sm lg:text-base hover:bg-white hover:text-[#302E2E] transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          ) : (
            <p>No question selected.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questions;
