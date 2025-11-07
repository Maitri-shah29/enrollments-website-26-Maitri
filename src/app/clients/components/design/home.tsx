"use client";
import Image from "next/image";
import type React from "react";

const Home: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <Image
        src="/images/design/flower.svg"
        alt="Home Design"
        width={250}
        height={250}
        className="object-cover absolute top-20 -right-20 animate-spin-slow"
      />
      <Image
        src="/images/design/disc.svg"
        alt="Home Design"
        width={175}
        height={175}
        className="object-cover absolute bottom-20 -left-15 animate-spin-slow"
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
          <a
            href="https://www.figma.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/images/design/app_icons/figma.webp"
              alt="figma"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </a>
          <a
            href="https://www.adobe.com/products/xd.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/images/design/app_icons/xd.webp"
              alt="adobe xd"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </a>
          <a
            href="https://www.adobe.com/products/premiere.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/images/design/app_icons/premirepro.webp"
              alt="premiere pro"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </a>
          <a
            href="https://www.adobe.com/products/aftereffects.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/images/design/app_icons/aftereffects.webp"
              alt="after effects"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </a>
          <a
            href="https://www.adobe.com/products/photoshop.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/images/design/app_icons/photoshop.webp"
              alt="photoshop"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </a>
          <a
            href="https://www.adobe.com/products/illustrator.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/images/design/app_icons/illustrator.webp"
              alt="illustrator"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </a>
          <a
            href="https://www.blender.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/images/design/app_icons/blender.webp"
              alt="blender"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </a>
          <a
            href="https://www.canva.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/images/design/app_icons/canva.webp"
              alt="canva"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;

{
  /*/images/ACM-VIT-Logo.svg*/
}
