"use client";
import Image from "next/image";
import type React from "react";
import type { DesignAOI } from "@/lib/types";

interface AOIsProps {
  joinedAOIs: Set<DesignAOI>;
  onJoinAOI: (aoi: DesignAOI) => void;
  onLeaveAOI: (aoi: DesignAOI) => void;
  aoiJoinLimit: number;
}

const AOI_DATA: {
  aoi: DesignAOI;
  title: string;
  banner: string;
  description: string;
}[] = [
  {
    aoi: "uiux",
    title: "UI/UX Design",
    banner: "/images/design/aoi_banners/uiux_banner.svg",
    description:
      "Good design shouldn’t make you think twice; it should just feel right. From quick sketches to full prototypes, every button and layout is made to look great and work even better. The goal is simple: smooth, easy, and satisfying. Our motto? Design that looks good and feels natural.",
  },
  {
    aoi: "videoediting",
    title: "Video Editing",
    banner: "/images/design/aoi_banners/videoediting_banner.svg",
    description:
      "Every clip has a story, it just needs the right cuts. Whether it’s a hype reel, event edit, or promo, we blend timing, music, and mood to make everything flow perfectly. If it makes you smile, rewind, or share it twice, we’ve done our job. Great editing isn’t just seen, it’s felt.",
  },
  {
    aoi: "illustrations",
    title: "Illustrations",
    banner: "/images/design/aoi_banners/illustrations_banner.svg",
    description:
      "Sometimes words just aren’t enough, and that’s where art steps in. From quick doodles to detailed digital pieces, illustrations add heart and style to every project. Cute, clever, or completely wild, we love bringing ideas to life in every form.",
  },
  {
    aoi: "motiongraphics",
    title: "Motion Graphics",
    banner: "/images/design/aoi_banners/motiongraphics_banner.svg",
    description:
      "Static designs are cool, but motion brings them to life. We love adding movement, bounce, and personality to visuals, turning simple ideas into something that instantly grabs attention. If it makes you say “whoa,” we know it worked.",
  },
  {
    aoi: "3d",
    title: "3D Design",
    banner: "/images/design/aoi_banners/3d-banner-fixed.svg",
    description:
      "Think imagination, but in HD. From dreamy concepts to jaw-dropping renders, we use 3D to create things that don’t even exist yet and make them look real enough to touch. It’s designed with extra dimensions, where creativity meets realism.",
  },
];

const AOIs: React.FC<AOIsProps> = ({
  joinedAOIs,
  onJoinAOI,
  onLeaveAOI,
  aoiJoinLimit,
}) => {
  const atLimit = joinedAOIs.size >= aoiJoinLimit;

  return (
    <div className="h-full w-full flex items-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%]">
      <h1 className="text-[8vh] lg:text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0 mb-[1.5%]">
        Areas of Interest
      </h1>
      {atLimit && (
        <div className="text-[#F55F4B] text-lg font-coolvetica font-bold mb-4 bg-[#F55F4B]/10 px-6 py-3 rounded-lg border border-[#F55F4B]/30">
          You can join up to {aoiJoinLimit} AOIs only. Leave one to join
          another.
        </div>
      )}
      {AOI_DATA.map((aoiItem, index) => {
        const isJoined = joinedAOIs.has(aoiItem.aoi);
        const disableJoin = atLimit && !isJoined;
        const isEven = index % 2 === 0;

        return (
          <div
            key={aoiItem.aoi}
            className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} px-[3%] gap-[3%] mb-[3%]`}
          >
            <div className="w-full lg:w-[50%]">
              <Image
                src={aoiItem.banner}
                alt={aoiItem.title}
                width={1920}
                height={1080}
                className="w-full"
              />
            </div>
            <div className="flex w-full lg:w-[50%] items-center flex-col justify-center gap-4">
              <p
                className={`font-coolvetica text-[clamp(0.875rem,1vw,1.125rem)] leading-relaxed ${isEven ? "" : "lg:text-end"}`}
              >
                {aoiItem.description}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (isJoined) {
                    onLeaveAOI(aoiItem.aoi);
                  } else if (!disableJoin) {
                    onJoinAOI(aoiItem.aoi);
                  }
                }}
                disabled={disableJoin}
                className={`px-10 py-4 border-2 font-coolvetica rounded-lg transition-colors duration-200 ${
                  isJoined
                    ? "border-white bg-transparent hover:bg-[#F55F4B] hover:border-[#F55F4B] text-white"
                    : disableJoin
                      ? "border-white/30 bg-transparent text-white/30 cursor-not-allowed"
                      : "border-white bg-transparent hover:bg-[#43A363] hover:border-[#43A363] text-white"
                }`}
              >
                {isJoined
                  ? "Leave AOI"
                  : disableJoin
                    ? "Limit Reached"
                    : "Join AOI"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AOIs;
