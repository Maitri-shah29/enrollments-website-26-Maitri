"use client";
import Image from "next/image";

export default function About() {
  return (
    <div className="bg-[#08111D] p-4 rounded-lg">
      <div className="flex justify-center -mt-8">
        <Image
          src="/images/about-tech.svg"
          alt="acm logo"
          width={700}
          height={700}
          draggable={false}
        />
      </div>
      <div className="flex text-[#993C7A] font-mono text-lg leading-relaxed mt-15">
        <pre className="text-[#E097CE] whitespace-pre-wrap max-w-4xl">
          {`The Tech Domain of ACM VIT focuses on exploring and developing practical technical skills through projects, workshops, and collaboration. It covers areas such as web and app development, AI, and other emerging technologies. Members gain hands-on experience while learning to build real-world solutions and contribute to open-source initiatives. The domain fosters an environment where ideas evolve into impactful technology and learning happens through application.`}
        </pre>
      </div>
    </div>
  );
}
