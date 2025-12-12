"use client";
import Image from "next/image";

type Props = {
  activeAOI: string;
};

export default function AOIContent({ activeAOI }: Props) {
  const aoiData: Record<
    string,
    {
      text: string;
      image: string | Array<{ src: string; width: number; height: number }>;
      width: number;
      height: number;
    }
  > = {
    app: {
      text: `AppDev teaches members how to design and build mobile apps that feel great to use. From UI basics to full-fledged features, this track focuses on practical, hands-on app creation.

Focus Areas:
- Android & iOS fundamentals
- UI/UX essentials
- APIs & backend integration
- Building and shipping real apps`,
      image: "/images/tech-aois/app.svg",
      width: 500,
      height: 500,
    },
    web: {
      text: `WebDev covers everything needed to build modern websites and web apps. Members work with front-end, back-end, and deployment tools to create smooth, functional online experiences.

Focus Areas:
- HTML, CSS, JS fundamentals
- Frontend frameworks
- Backend & databases
- Hosting & deployment`,
      image: "/images/tech-aois/web.svg",
      width: 500,
      height: 500,
    },
    gamedev: {
      text: `GameDev brings creativity and tech together. Members learn game engines, storytelling basics, and how to turn ideas into playable experiences.

Focus Areas:
- Game engine fundamentals
- Gameplay design
- Art, animation & sound basics
- Building small, complete games`,
      image: "/images/tech-aois/gamedev.svg",
      width: 800,
      height: 800,
    },
    foss: {
      text: `FOSS is all about building software in the open. Members learn how open-source communities work, contribute to real projects, and understand what makes collaborative development so powerful.

Focus Areas:
- Open-source tools & ecosystems
- Version control & collaboration
- Contributing to real projects
- Community-driven development`,
      image: "/images/tech-aois/foss.svg",
      width: 600,
      height: 600,
    },
    devops: {
      text: `DevOps focuses on making development faster, smoother, and more reliable. Members explore how automation, CI/CD, and cloud tooling keep modern engineering teams moving without chaos.

Focus Areas:
- CI/CD pipelines
- Containerization & orchestration
- Cloud deployment basics
- Monitoring & automation`,
      image: [
        { src: "/images/tech-aois/devops.svg", width: 510, height: 510 },
        { src: "/images/dockerdevopsascii.svg", width: 218, height: 271 },
      ],
      width: 510,
      height: 510,
    },
  };

  const aoi = aoiData[activeAOI];
  if (!aoi) return null;

  const numLines = aoi.text.split(".").length + 1;

  const images = Array.isArray(aoi.image)
    ? aoi.image
    : [{ src: aoi.image, width: aoi.width, height: aoi.height }];

  return (
    <div className="text-[#993C7A] text-2xl font-semibold flex items-center flex-col">
      <div className="flex gap-12 items-center mt-5">
        {images.map((img, index) => (
          <Image
            key={index}
            src={img.src}
            alt={`${activeAOI} logo ${index + 1}`}
            width={img.width}
            height={img.height}
          />
        ))}
      </div>
      <div className="flex text-[#993C7A] font-mono text-lg leading-relaxed mt-15">
        <pre className="whitespace-pre-wrap text-[#E097CE] max-w-4xl">
          {aoi.text}
        </pre>
      </div>
    </div>
  );
}
