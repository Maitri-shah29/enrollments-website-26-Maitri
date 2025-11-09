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
      <div className="flex flex-col lg:flex-row px-[3%] gap-[3%] mb-[3%]">
        <div className="w-full lg:w-[50%]">
          <Image
            src="/images/design/aoi_banners/uiux_banner.svg"
            alt="Home Design Foreground"
            width={1920}
            height={1080}
            className="w-full"
          />
        </div>
        <div className="flex w-full lg:w-[50%] items-center">
          <p className="font-coolvetica text-[clamp(0.875rem,1vw,1.125rem)] leading-relaxed">
            Good design shouldn’t make you think twice; it should just feel
            right. From quick sketches to full prototypes, every button and
            layout is made to look great and work even better. The goal is
            simple: smooth, easy, and satisfying. Our motto? Design that looks
            good and feels natural.{" "}
          </p>
        </div>
      </div>
      <div className="flex flex-col-reverse lg:flex-row px-[3%] gap-[3%] mb-[3%]">
        <div className="flex w-full lg:w-[50%] items-center">
          <p className="font-coolvetica text-[clamp(0.875rem,1vw,1.125rem)] lg:text-end leading-relaxed">
            Every clip has a story, it just needs the right cuts. Whether it’s a
            hype reel, event edit, or promo, we blend timing, music, and mood to
            make everything flow perfectly. If it makes you smile, rewind, or
            share it twice, we’ve done our job. Great editing isn’t just seen,
            it’s felt.{" "}
          </p>
        </div>
        <div className="w-full lg:w-[50%]">
          <Image
            src="/images/design/aoi_banners/videoediting_banner.svg"
            alt="Home Design Foreground"
            width={500}
            height={500}
            className="w-full"
          />
        </div>
      </div>
      <div className="flex flex-col lg:flex-row px-[3%] gap-[3%] mb-[3%]">
        <div className="w-full lg:w-[50%]">
          <Image
            src="/images/design/aoi_banners/illustrations_banner.svg"
            alt="Home Design Foreground"
            width={500}
            height={500}
            className="w-full"
          />
        </div>
        <div className="flex w-full lg:w-[50%] items-center">
          <p className="font-coolvetica text-[clamp(0.875rem,1vw,1.125rem)] leading-relaxed">
            Sometimes words just aren’t enough, and that’s where art steps in.
            From quick doodles to detailed digital pieces, illustrations add
            heart and style to every project. Cute, clever, or completely wild,
            we love bringing ideas to life in every form.{" "}
          </p>
        </div>
      </div>
      <div className="flex flex-col-reverse lg:flex-row px-[3%] gap-[3%] mb-[3%]">
        <div className="flex w-full lg:w-[50%] items-center">
          <p className="font-coolvetica text-[clamp(0.875rem,1vw,1.125rem)] lg:text-end leading-relaxed">
            Static designs are cool, but motion brings them to life. We love
            adding movement, bounce, and personality to visuals, turning simple
            ideas into something that instantly grabs attention. If it makes you
            say “whoa,” we know it worked.{" "}
          </p>
        </div>
        <div className="w-full lg:w-[50%]">
          <Image
            src="/images/design/aoi_banners/motiongraphics_banner.svg"
            alt="Home Design Foreground"
            width={500}
            height={500}
            className="w-full"
          />
        </div>
      </div>
      <div className="flex flex-col lg:flex-row px-[3%] gap-[3%] mb-[3%]">
        <div className="w-full lg:w-[50%]">
          <Image
            src="/images/design/aoi_banners/3d-banner-fixed.svg"
            alt="Home Design Foreground"
            width={500}
            height={500}
            className="w-full"
          />
        </div>
        <div className="flex w-full lg:w-[50%] items-center">
          <p className="font-coolvetica text-[clamp(0.875rem,1vw,1.125rem)] leading-relaxed">
            Think imagination, but in HD. From dreamy concepts to jaw-dropping
            renders, we use 3D to create things that don’t even exist yet and
            make them look real enough to touch. It’s designed with extra
            dimensions, where creativity meets realism.{" "}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AOIs;
