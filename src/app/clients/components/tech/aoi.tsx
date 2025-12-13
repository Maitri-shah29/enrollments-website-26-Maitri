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
      text: `AppDev is all about building experiences that live in people’s pockets. From crafting clean interfaces to wiring up powerful features, you’ll learn how to turn ideas into polished mobile apps that feel intuitive, responsive, and ready for real users.

Focus Areas:
- Android & iOS Development
- UI/UX essentials
- APIs & backend integration
- Building and shipping real apps`,
      image: "/images/tech-aois/app.svg",
      width: 500,
      height: 500,
    },
    web: {
      text: `WebDev is about building the digital spaces people interact with every day. From sleek frontends to solid backends, you’ll learn how modern websites and web apps are designed, built, and deployed - creating experiences that are fast, functional, and built to scale.

Focus Areas:
- HTML, CSS, JS, Python and beyond.
- Frontend frameworks
- Backend & databases
- Hosting & deployment`,
      image: "/images/tech-aois/web.svg",
      width: 500,
      height: 500,
    },
    gamedev: {
      text: `GameDev is where imagination turns interactive. You’ll explore how games are built from the ground up - mechanics, visuals, sound, and storytelling, then bring it all together into something playable. It’s creativity, logic, and a lot of fun rolled into one.

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
      text: `FOSS is where code meets community. You don’t just write software - you build it in the open, alongside people from across the world. From your first pull request to meaningful contributions, this is where you learn how real collaboration happens and why open-source powers so much of modern tech.

Focus Areas:
- Open-source tools & ecosystems
- Contributing to real projects
- Community-driven development
- We love Linux :)`,
      image: "/images/tech-aois/foss.svg",
      width: 600,
      height: 600,
    },
    devops: {
      text: `DevOps is the art of making things just work. You’ll learn how software goes from a developer’s laptop to the real world - fast, stable, and without panic. Automation, pipelines, and cloud tools come together here to keep systems running smoothly even when things scale.

Focus Areas:
- CI/CD pipelines
- Containerization & orchestration
- Cloud deployment basics
- Monitoring at scale`,
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
            draggable={false}
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
