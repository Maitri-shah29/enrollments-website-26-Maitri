"use client";

import Image from "next/image";
import type React from "react";

const Instructions: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-start flex-col px-[5%] pb-[3%] overflow-y-auto [--scrollbar-thumb:#F55F4B]">
      <h1 className="text-[8vh] lg:text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0 mb-[1.5%]">
        Instructions
      </h1>

      <div className="flex flex-col lg:flex-row justify-center items-center gap-[3%] w-full">
        <div className="relative flex-1 w-full lg:w-auto">
          <Image
            src="/images/design/instructions_graphic.svg"
            alt="About Graphic"
            width={500}
            height={500}
            className="w-[8%] lg:w-[10%] absolute -top-7 -left-7"
            draggable={false}
          />
          <p className="px-[5%] lg:px-[8%] pt-[5%] font-coolvetica text-2xl">
            Welcome to the first round of ACM-VIT's Design Domain selections! In
            this round, you'll have the opportunity to showcase your creative
            skills and design thinking by answering a series of questions.
            <br />
            <br />
            <ul className="list-disc pl-6 space-y-2 text-white">
              <li>
                PS - You’ll probably use AI for these questions, which is
                totally fine. Just keep in mind that we’ll be evaluating your
                originality and your ability to learn so feel free to use AI for
                support, but make sure your answers reflect your own thinking.
              </li>
              <li>
                You can select a maximum of 2 Areas of Interest (AoIs) that
                align with your passion and skills. These AOIs will help us
                understand your interests better and may influence the type of
                projects you'll work on if you’re selected.{" "}
              </li>
              <li>
                Click on “Save Answer” after every question you answer. You may
                change your answers after you save answer. You cannot change
                your answers once you have submitted the form.
              </li>
              <li>
                Once you've answered all the questions, review your responses
                and click “Submit Form”.{" "}
              </li>
            </ul>
            <br></br>
            We're looking for creativity, originality, and your personal
            approach to solving design challenges together.
            <br></br>
            Good Luck!
          </p>
        </div>
        <Image
          src="/images/design/instructions_post.svg"
          alt="About Graphic"
          width={500}
          height={500}
          className="w-[60%] lg:w-[30%] mx-auto lg:mx-0 lg:mr-[3%] mt-[3%] lg:mt-0"
          draggable={false}
        />
      </div>
    </div>
  );
};

export default Instructions;
