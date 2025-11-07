"use client";
import Image from "next/image";
import type React from "react";

const AOIs: React.FC = () => {
  return (
    <div className="h-full w-full flex items-center flex-col">
      <h1 className="text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0">
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
          <p className="font-georgia text-[clamp(0.875rem,1vw,1.125rem)] leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel
            nisi at nisl luctus tincidunt. Aliquam semper erat et nibh
            scelerisque vulputate Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam
            semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit
            amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus
            tincidunt.{" "}
          </p>
        </div>
      </div>
      <div className="flex flex-col-reverse lg:flex-row px-[3%] gap-[3%] mb-[3%]">
        <div className="flex w-full lg:w-[50%] items-center">
          <p className="font-georgia text-[clamp(0.875rem,1vw,1.125rem)] lg:text-end leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel
            nisi at nisl luctus tincidunt. Aliquam semper erat et nibh
            scelerisque vulputate Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam
            semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit
            amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus
            tincidunt.{" "}
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
          <p className="font-georgia text-[clamp(0.875rem,1vw,1.125rem)] leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel
            nisi at nisl luctus tincidunt. Aliquam semper erat et nibh
            scelerisque vulputate Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam
            semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit
            amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus
            tincidunt.{" "}
          </p>
        </div>
      </div>
      <div className="flex flex-col-reverse lg:flex-row px-[3%] gap-[3%] mb-[3%]">
        <div className="flex w-full lg:w-[50%] items-center">
          <p className="font-georgia text-[clamp(0.875rem,1vw,1.125rem)] lg:text-end leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel
            nisi at nisl luctus tincidunt. Aliquam semper erat et nibh
            scelerisque vulputate Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam
            semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit
            amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus
            tincidunt.{" "}
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
            src="/images/design/aoi_banners/3d_banner.svg"
            alt="Home Design Foreground"
            width={500}
            height={500}
            className="w-full"
          />
        </div>
        <div className="flex w-full lg:w-[50%] items-center">
          <p className="font-georgia text-[clamp(0.875rem,1vw,1.125rem)] leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel
            nisi at nisl luctus tincidunt. Aliquam semper erat et nibh
            scelerisque vulputate Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam
            semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit
            amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus
            tincidunt.{" "}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AOIs;
