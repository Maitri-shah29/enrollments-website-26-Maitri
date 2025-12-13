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
      "Good design shouldn’t make you think twice; it should just feel right. Every button and layout is made to look great and work even better. Our motto emphasises on design that looks good and feels natural.",
  },
  {
    aoi: "videoediting",
    title: "Video Editing",
    banner: "/images/design/aoi_banners/videoediting_banner.svg",
    description:
      "Every clip has a story, it just needs the right cuts. Whether it’s a hype reel, event edit or promo, we blend timing, music and tone to make sure that everything flows perfectly.",
  },
  {
    aoi: "illustrations",
    title: "Illustrations",
    banner: "/images/design/aoi_banners/illustrations_banner.svg",
    description:
      "Sometimes words just aren’t enough, and that’s where art steps in. Quick doodles, detailed digital pieces and thus illustrations add heart and style to every project. We love bringing ideas to life in every form.",
  },
  {
    aoi: "motiongraphics",
    title: "Motion Graphics",
    banner: "/images/design/aoi_banners/motiongraphics_banner.svg",
    description:
      "Static designs are cool, but motion brings them to life. We love adding movement, bounce and personality to visuals, turning simple ideas into something that instantly grabs attention.",
  },
  {
    aoi: "3d",
    title: "3D Design",
    banner: "/images/design/aoi_banners/3d-banner-fixed.svg",
    description:
      "We transform raw ideas into lifelike worlds with Blender in order to turn imagination into immersive 3D experiences. Whether it’s modelling, animation, lighting or simulations, every project compliments technical mastery. ",
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
    <div className="h-full w-full flex items-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [--scrollbar-thumb:#F55F4B] pb-[3%]">
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
            className={`flex flex-col ${
              isEven ? "lg:flex-row" : "lg:flex-row-reverse"
            } px-[3%] gap-[3%] mb-[3%]`}
          >
            <div className="w-full lg:w-[50%]">
              <Image
                src={aoiItem.banner}
                alt={aoiItem.title}
                width={1920}
                height={1080}
                className="w-full"
                draggable={false}
              />
            </div>
            <div className="flex w-full lg:w-[50%] items-center flex-col justify-center gap-4 mt-5">
              <h2 className="font-coolvetica text-white text-2xl lg:text-3xl font-bold text-center">
                {aoiItem.title}
              </h2>
              <p
                className={`mt-1 font-coolvetica text-[clamp(1.1rem,1.3vw,1.5rem)] leading-relaxed text-center`}
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
                className={`px-7 py-2 border-2 font-coolvetica rounded-lg mt-5 transition-colors duration-200 ${
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
