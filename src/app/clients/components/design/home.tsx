"use client";
import Image from "next/image";
import type React from "react";

type Props = {
  onGetStarted?: () => void;
  loading?: boolean;
  hasRoundUser?: boolean;
  onContinue?: () => void;
  showResults?: boolean;
  onViewResults?: () => void;
};

export default function Home({
  onGetStarted,
  loading = false,
  hasRoundUser = false,
  onContinue,
  showResults = false,
  onViewResults,
}: Props) {
  const showResultsCta = showResults && !!onViewResults;
  return (
    <div className="w-full h-full flex items-center justify-center overflow-y-auto  [--scrollbar-thumb:#F55F4B]">
      <Image
        src="/images/design/flower.svg"
        alt="Home Design"
        width={250}
        height={250}
        draggable={false}
        className="object-cover absolute top-20 right-10 animate-spin-slow select-none"
      />
      <Image
        src="/images/design/disc.svg"
        alt="Home Design"
        width={175}
        height={175}
        draggable={false}
        className="object-cover absolute bottom-20 -left-15 animate-spin-slow select-none"
      />
      <div className="flex flex-col h-full w-full justify-center items-center figma-cursor">
        <Image
          src="/images/design/welcome.svg"
          alt="Home Design Foreground"
          width={1200}
          height={600}
          draggable={false}
          className="relative w-[60%] select-none"
        />
        <div className="w-210 h-0.5 rounded-full bg-white opacity-99 mt-10"></div>
        {/* {onGetStarted && (
          <button
            onClick={onGetStarted}
            disabled={loading}
            className="mt-8 px-8 py-3 bg-white text-black font-coolvetica text-lg rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {loading ? "Loading..." : "Get Started"}
          </button>
        )} */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={
              showResultsCta
                ? onViewResults
                : hasRoundUser
                  ? onContinue
                  : onGetStarted
            }
            disabled={loading && !hasRoundUser && !showResultsCta}
            className="mt-8 px-8 py-3 bg-white text-black font-coolvetica text-lg rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showResultsCta
              ? "View Results →"
              : hasRoundUser
                ? "Continue →"
                : loading
                  ? "Loading..."
                  : "Get Started →"}
          </button>
        </div>

        <div className="flex gap-15 mt-10">
          <div className="bg-transparent border-none p-0">
            <Image
              src="/images/design/app_icons/figma.webp"
              alt="figma"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
            />
          </div>
          <div className="bg-transparent border-none p-0">
            <Image
              src="/images/design/app_icons/xd.webp"
              alt="adobe xd"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
            />
          </div>
          <div className="bg-transparent border-none p-0">
            <Image
              src="/images/design/app_icons/premirepro.webp"
              alt="premiere pro"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
            />
          </div>
          <div className="bg-transparent border-none p-0">
            <Image
              src="/images/design/app_icons/aftereffects.webp"
              alt="after effects"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
            />
          </div>
          <div className="bg-transparent border-none p-0">
            <Image
              src="/images/design/app_icons/photoshop.webp"
              alt="photoshop"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
            />
          </div>
          <div className="bg-transparent border-none p-0">
            <Image
              src="/images/design/app_icons/illustrator.webp"
              alt="illustrator"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
            />
          </div>
          <div className="bg-transparent border-none p-0">
            <Image
              src="/images/design/app_icons/blender.webp"
              alt="blender"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
            />
          </div>
          <div className="bg-transparent border-none p-0">
            <Image
              src="/images/design/app_icons/canva.webp"
              alt="canva"
              width={50}
              height={50}
              className="relative w-12 h-12 mx-auto transition-all hover:scale-110 hover:rotate-5 duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

{
  /*/images/ACM-VIT-Logo.svg*/
}
