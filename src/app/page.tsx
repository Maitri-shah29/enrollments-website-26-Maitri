import Image from "next/image";
import React from "react";
import Landing from "./components/Landing";

const page = () => {
  return (
    <>
      <div className="w-screen h-screen overflow-hidden">
        <Image
          src="/images/backdrop.jpeg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority
          className="absolute top-0 left-0 -z-10"
        />
        <div className="absolute top-0 left-0 -z-9 bg-white/30 h-full w-full"></div>
        <div className="p-5 h-full w-full flex items-center justify-center">
          <Landing />
        </div>
      </div>
    </>
  );
};

export default page;
