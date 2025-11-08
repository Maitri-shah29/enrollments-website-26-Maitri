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
      text: "The App Development domain focuses on building robust mobile and desktop applications. Members learn cutting-edge technologies like React Native, Flutter, and Kotlin to design apps that are not only user-centric but also highly scalable and performant. We explore platform-specific features, learn about cross-platform development strategies, and understand how to optimize apps for different screen sizes and device capabilities. The domain also covers essential topics like state management, API integration, local storage, push notifications, and app store deployment, preparing members to launch production-ready applications.",
      image: "/images/tech-aois/app.svg",
      width: 500,
      height: 500,
    },
    web: {
      text: "The Web Development domain emphasizes creating full-stack web solutions. Participants gain comprehensive skills in both frontend and backend technologies, mastering frameworks like Next.js, React, Express, and databases like PostgreSQL and MongoDB to build high-performance, modern websites and web applications. We cover responsive design principles and accessibility standards to RESTful API development and server-side rendering. The domain also delves into modern web practices including Progressive Web Apps (PWAs), WebSockets for real-time communication, GraphQL for efficient data fetching, and containerization with Docker.",
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
    devops: {
      text: "The DevOps domain bridges development and operations, focusing on automation, continuous integration, and deployment. Members learn tools like Docker, Kubernetes, Jenkins, and Terraform to build robust CI/CD pipelines and manage cloud infrastructure efficiently.",
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
