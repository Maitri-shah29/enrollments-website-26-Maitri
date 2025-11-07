"use client";

import Image from "next/image";
import type React from "react";

const Interview: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-start flex-col px-[5%] py-[3%] overflow-y-auto">
      <h1 className="text-[8vh] lg:text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0 mb-[3%] mt-[2%]">
        Interviews
      </h1>

      <div className="flex flex-col lg:flex-row justify-center items-center gap-[3%] w-full">
        <div className="relative flex-1 w-full lg:w-auto">
          <Image
            src="/images/design/interview_graphic.svg"
            alt="About Graphic"
            width={500}
            height={500}
            className="w-[12%] lg:w-[15%] absolute -top-[18%] left-[3%] lg:left-[1%]"
          />
          <p className="px-[5%] lg:px-[8%] pt-[5%] font-georgia text-[clamp(0.875rem,1vw,1.125rem)] leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel
            nisi at nisl luctus tincidunt. Aliquam semper erat et nibh
            scelerisque vulputate Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam
            semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit
            amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus
            tincidunt. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            <br />
            <br />
            Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et
            nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam
            semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit
            amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus
            tincidunt.
          </p>
        </div>
        <Image
          src="/images/design/interview_post.svg"
          alt="About Graphic"
          width={500}
          height={500}
          className="w-[60%] lg:w-[30%] mx-auto lg:mx-0 lg:mr-[3%] mt-[3%] lg:mt-0"
        />
      </div>
    </div>
  );
};

export default Interview;
