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
            Welcome to the first round of ACM-VIT's Design Domain recruitment!
            In this round, you'll have the opportunity to showcase your creative
            skills and design thinking. You'll be presented with a series of
            questions that test your understanding of design principles.
            <br />
            <br />
            You can select a maximum of 2 Areas of Interest (AOIs) that align
            with your passion and skills. These AOIs will help us understand
            your interests better and may influence the type of projects you'll
            work on if you’re selected. Once you've answered all the questions
            to the best of your ability, review your responses and click submit.
            We're looking for creativity, originality, and your personal
            approach to solving design challenges. Good luck!
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
