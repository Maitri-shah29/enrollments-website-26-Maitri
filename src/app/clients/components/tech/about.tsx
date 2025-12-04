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
        />
      </div>
      <div className="flex text-[#993C7A] font-mono text-lg leading-relaxed mt-15">
        <pre className="text-[#E097CE] whitespace-pre-wrap max-w-4xl">
          {`What's a tech chapter without its tech spirit?
At ACM VIT, the Tech Domain brings together creators from Web, App, DevOps, FOSS, and GameDev to build things that actually ship. From clean architecture and testing to performance, accessibility, and security, we focus on engineering that matters.
We love building cool, impactful projects, contributing to open source, and learning by building — together.`}
        </pre>
      </div>
    </div>
  );
}
