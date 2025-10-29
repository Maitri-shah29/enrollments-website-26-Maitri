"use client";
import Image from "next/image";
import React from "react";

type Props = {
  activeAOI: string;
};

export default function AOIContent({ activeAOI }: Props) {
  const aoiData: Record<
    string,
    { text: string; image: string; width: number; height: number }
  > = {
    app: {
      text: "The App Development domain focuses on building robust mobile and desktop applications. Members learn technologies like React Native, Flutter, and Kotlin to design apps that are user-centric and scalable.",
      image: "/images/tech-aois/app.svg",
      width: 500,
      height: 500,
    },
    web: {
      text: "The Web Development domain emphasizes creating full-stack web solutions. Participants gain skills in frameworks like Next.js, Express, and databases like PostgreSQL and MongoDB to build high-performance, modern websites.",
      image: "/images/tech-aois/web.svg",
      width: 500,
      height: 500,
    },
    gamedev: {
      text: "The Game Development domain brings creativity and logic together. Developers explore Unity, Unreal Engine, and Godot to create immersive experiences, learning both design and real-time rendering techniques.",
      image: "/images/tech-aois/gamedev.svg",
      width: 800,
      height: 800,
    },
    foss: {
      text: "The FOSS (Free and Open Source Software) domain nurtures collaborative software development. Students contribute to open-source projects on GitHub, learning version control, documentation, and large-scale code management.",
      image: "/images/tech-aois/foss.svg",
      width: 600,
      height: 600,
    },
  };

  const aoi = aoiData[activeAOI];
  if (!aoi) return null;

  const numLines = aoi.text.split(".").length + 1;

  return (
    <div className="text-[#993C7A] text-2xl font-semibold flex items-center flex-col">
      <Image
        src={aoi.image}
        alt={`${activeAOI} logo`}
        width={aoi.width}
        height={aoi.height}
        className="mt-5"
      />
      <div className="flex text-[#993C7A] font-mono text-lg leading-relaxed mt-15">
        <pre className="text-right pr-4 select-none text-[#993C7A]">
          {Array.from({ length: numLines }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </pre>

        <pre className="whitespace-pre-wrap text-[#E097CE] max-w-4xl">
          {aoi.text}
        </pre>
      </div>
    </div>
  );
}
