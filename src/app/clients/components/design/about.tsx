"use client";

import Image from "next/image";
import type React from "react";

const About: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-start flex-col px-[5%] pb-[3%] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [--scrollbar-thumb:#F55F4B]">
      <h1 className="text-[8vh] lg:text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0 mb-[1.5%]">
        About
      </h1>

      <div className="flex flex-col lg:flex-row justify-center items-center gap-[3%] w-full">
        <div className="relative flex-1 w-full lg:w-auto">
          <Image
            src="/images/design/about_graphic.svg"
            alt="About Graphic"
            width={500}
            height={500}
            className="w-[8%] lg:w-[10%] absolute -top-10 left-5"
          />
          <p className="px-[5%] lg:px-[8%] pt-[5%] font-coolvetica text-2xl break-words">
            Design is where creativity meets purpose. It’s not just about how
            something looks, but how it feels and functions. Our team blends
            creativity with clarity, shaping visuals, stories, and experiences
            that leave a mark. From clean UI/UX designs to bold motion graphics,
            from cinematic edits to immersive 3D worlds and expressive
            illustrations every detail is crafted with purpose. We design to
            connect, inspire, and bring ideas to life.
          </p>
        </div>
        <Image
          src="/images/design/about_post.svg"
          alt="About Graphic"
          width={500}
          height={500}
          className="w-[60%] lg:w-[30%] mx-auto lg:mx-0 lg:mr-[3%] mt-[3%] lg:mt-0"
        />
      </div>
    </div>
  );
};

export default About;
