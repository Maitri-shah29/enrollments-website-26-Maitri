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
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt.",
  },
  {
    aoi: "videoediting",
    title: "Video Editing",
    banner: "/images/design/aoi_banners/videoediting_banner.svg",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt.",
  },
  {
    aoi: "illustrations",
    title: "Illustrations",
    banner: "/images/design/aoi_banners/illustrations_banner.svg",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt.",
  },
  {
    aoi: "motiongraphics",
    title: "Motion Graphics",
    banner: "/images/design/aoi_banners/motiongraphics_banner.svg",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt.",
  },
  {
    aoi: "3d",
    title: "3D Design",
    banner: "/images/design/aoi_banners/3d-banner-fixed.svg",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt.",
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
