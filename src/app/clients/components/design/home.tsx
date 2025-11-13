"use client";
import Image from "next/image";
import type React from "react";

interface HomeProps {
  onGetStarted?: () => void;
  loading?: boolean;
}

const Home: React.FC<HomeProps> = ({ onGetStarted, loading = false }) => {
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

        {onGetStarted && (
          <button
            onClick={onGetStarted}
            disabled={loading}
            className="mt-8 px-8 py-3 bg-white text-black font-coolvetica text-lg rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {loading ? "Loading..." : "Get Started"}
          </button>
        )}

        <div className="flex gap-15 mt-10">
          <button
            type="button"
            onClick={() => {
              window.parent.postMessage(
                { type: "NAVIGATE_TO", url: "https://www.figma.com" },
                "*",
              );
            }}
            aria-label="Open Figma"
            className="bg-transparent border-none p-0 cursor-pointer"
          >
            <Image
              src="/images/design/app_icons/figma.webp"
              alt="figma"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              window.parent.postMessage(
                {
                  type: "NAVIGATE_TO",
                  url: "https://www.adobe.com/products/xd.html",
                },
                "*",
              );
            }}
            aria-label="Open Adobe XD"
            className="bg-transparent border-none p-0 cursor-pointer"
          >
            <Image
              src="/images/design/app_icons/xd.webp"
              alt="adobe xd"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              window.parent.postMessage(
                {
                  type: "NAVIGATE_TO",
                  url: "https://www.adobe.com/products/premiere.html",
                },
                "*",
              );
            }}
            aria-label="Open Premiere Pro"
            className="bg-transparent border-none p-0 cursor-pointer"
          >
            <Image
              src="/images/design/app_icons/premirepro.webp"
              alt="premiere pro"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              window.parent.postMessage(
                {
                  type: "NAVIGATE_TO",
                  url: "https://www.adobe.com/products/aftereffects.html",
                },
                "*",
              );
            }}
            aria-label="Open After Effects"
            className="bg-transparent border-none p-0 cursor-pointer"
          >
            <Image
              src="/images/design/app_icons/aftereffects.webp"
              alt="after effects"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              window.parent.postMessage(
                {
                  type: "NAVIGATE_TO",
                  url: "https://www.adobe.com/products/photoshop.html",
                },
                "*",
              );
            }}
            aria-label="Open Photoshop"
            className="bg-transparent border-none p-0 cursor-pointer"
          >
            <Image
              src="/images/design/app_icons/photoshop.webp"
              alt="photoshop"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              window.parent.postMessage(
                {
                  type: "NAVIGATE_TO",
                  url: "https://www.adobe.com/products/illustrator.html",
                },
                "*",
              );
            }}
            aria-label="Open Illustrator"
            className="bg-transparent border-none p-0 cursor-pointer"
          >
            <Image
              src="/images/design/app_icons/illustrator.webp"
              alt="illustrator"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              window.parent.postMessage(
                { type: "NAVIGATE_TO", url: "https://www.blender.org" },
                "*",
              );
            }}
            aria-label="Open Blender"
            className="bg-transparent border-none p-0 cursor-pointer"
          >
            <Image
              src="/images/design/app_icons/blender.webp"
              alt="blender"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              window.parent.postMessage(
                { type: "NAVIGATE_TO", url: "https://www.canva.com" },
                "*",
              );
            }}
            aria-label="Open Canva"
            className="bg-transparent border-none p-0 cursor-pointer"
          >
            <Image
              src="/images/design/app_icons/canva.webp"
              alt="canva"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200 cursor-pointer"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;

{
  /*/images/ACM-VIT-Logo.svg*/
}
