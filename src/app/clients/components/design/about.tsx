"use client";

import Image from "next/image";
import type React from "react";

const About: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center flex-col px-20">
      <h1 className="text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0">
        About
      </h1>

      <div className="flex justify-center items-center gap-10">
        <div className="relative">
          <Image
            src="/images/design/about_graphic.svg"
            alt="About Graphic"
            width={500}
            height={500}
            className="w-[10%] top-[35%] left-20"
          />
          <p className="px-20 font-georgia">
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
          src="/images/design/about_post.svg"
          alt="About Graphic"
          width={500}
          height={500}
          className="w-[30%] mr-10"
        />
      </div>
    </div>
  );
};

export default About;
