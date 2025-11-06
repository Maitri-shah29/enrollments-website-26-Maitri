"use client";
import Image from "next/image";
import type React from "react";

const Home: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <Image
        src="/images/design/landing-background.svg"
        alt="Home Design"
        width={1920}
        height={1080}
        className="w-full h-full object-cover absolute top-0"
      />
      <div className="flex flex-col h-screen w-full justify-center items-center figma-cursor">
        <Image
          src="/images/design/welcome.svg"
          alt="Home Design Foreground"
          width={1200}
          height={600}
          className="relative w-[60%]"
        />
        <div className="w-210 h-0.5 rounded-full bg-white opacity-99 mt-10"></div>

        <div className="flex gap-15 mt-10">
          <Image
            src="/images/design/app_icons/figma.webp"
            alt="after effects"
            width={50}
            height={50}
            className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
          />
          <Image
            src="/images/design/app_icons/xd.webp"
            alt="after effects"
            width={50}
            height={50}
            className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
          />
          <Image
            src="/images/design/app_icons/premirepro.webp"
            alt="after effects"
            width={50}
            height={50}
            className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
          />
          <Image
            src="/images/design/app_icons/aftereffects.webp"
            alt="after effects"
            width={50}
            height={50}
            className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
          />
          <Image
            src="/images/design/app_icons/photoshop.webp"
            alt="after effects"
            width={50}
            height={50}
            className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
          />
          <Image
            src="/images/design/app_icons/illustrator.webp"
            alt="after effects"
            width={50}
            height={50}
            className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
          />
          <Image
            src="/images/design/app_icons/blender.webp"
            alt="after effects"
            width={50}
            height={50}
            className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
          />
          <Image
            src="/images/design/app_icons/canva.webp"
            alt="after effects"
            width={50}
            height={50}
            className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
