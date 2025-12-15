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
          {`We build technology that people genuinely rely on. From full-stack mobile and web applications to AI-driven systems and emerging tech, our focus is on keeping up with the latest advances in tech world-over, hands-on development and real problem-solving. Working with modern stacks using languages and frameworks such as React Native, Rust, Next.js, Python and much more, we turn ideas into scalable, impactful solutions. Through collaboration, projects, and workshops, learning happens by building, where experimentation drives growth and curiosity turns into meaningful technology. Because technology matters!`}
        </pre>
      </div>
    </div>
  );
}
