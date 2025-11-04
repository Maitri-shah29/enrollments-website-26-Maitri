"use client";
import Image from "next/image";
import type React from "react";

const Home: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center -z-9 overflow-hidden">
      <Image
        src="/images/design/landing-background.svg"
        alt="Home Design"
        width={1920}
        height={1080}
        className="w-full h-full object-cover absolute top-0"
      />
      <div className="flex h-screen w-full justify-center items-center">
        <Image
          src="/images/design/welcome.svg"
          alt="Home Design Foreground"
          width={1200}
          height={600}
          className="relative w-[60%]"
        />
      </div>
    </div>
  );
};

export default Home;
