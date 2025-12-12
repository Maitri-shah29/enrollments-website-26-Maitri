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
          />
          <p className="px-[5%] lg:px-[8%] pt-[5%] font-coolvetica text-2xl mb-5">
            Before you dive into showcasing your creativity, please take a
            moment to read the following instructions carefully:
          </p>
          <ol className="list-decimal px-[10%] lg:px-[12%]  font-coolvetica text-2xl mb-5">
            <li>⁠After answering a question, click on “Save Answer”.</li>
            <li>
              You can save multiple times and only your most recent saved answer
              will be considered.
            </li>
            <li>
              You can apply to a maximum of three Areas of Interest (AOIs)
              within the Design Domain.
            </li>
            <li>
              To know more about each AOI, head over to the AOI Page from the
              navigation bar for detailed information.
            </li>
          </ol>
          <p className="px-[5%] lg:px-[8%] font-coolvetica text-2xl">
            That’s it! Trust your instincts, play with ideas, and let creativity
            take the wheel. And hey don’t forget to have fun while you’re at it!
          </p>
        </div>
        <Image
          src="/images/design/instructions_post.svg"
          alt="About Graphic"
          width={500}
          height={500}
          className="w-[60%] lg:w-[30%] mx-auto lg:mx-0 lg:mr-[3%] mt-[3%] lg:mt-0"
        />
      </div>
    </div>
  );
};

export default Instructions;
