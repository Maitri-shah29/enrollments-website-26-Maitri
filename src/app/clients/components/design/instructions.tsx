"use client";

import Image from "next/image";
import type React from "react";

const Instructions: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-start flex-col px-[5%] pb-[3%] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
            className="w-[8%] lg:w-[10%] absolute -top-[20%] left-[3%] lg:left-[3%]"
          />
          <p className="px-[5%] lg:px-[8%] pt-[5%] font-coolvetica text-[clamp(0.875rem,1vw,1.125rem)] leading-relaxed">
            Welcome to the Design Domain! Before you dive into showcasing your
            creativity, please take a moment to read the following instructions
            carefully:
            <br /> <br />
            1. After answering a question, click on “Submit.” <br />
            2. You can submit multiple times and only your most recent
            submission will be considered. <br />
            3. You can apply to a maximum of three Areas of Interest (AOIs)
            within the Design Domain. <br />
            4. To know more about each AOI, head over to the AOI Page from the
            navigation bar for detailed information. <br />
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
