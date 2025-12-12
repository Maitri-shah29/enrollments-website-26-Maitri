"use client";
import Image from "next/image";

export default function Instructions() {
  return (
    <div className="text-[#993C7A] text-2xl">
      <div className="flex justify-center -mt-8">
        <Image
          src="/images/tech-instructions.svg"
          alt="acm logo"
          width={700}
          height={700}
        />
      </div>
      <div className="flex text-[#993C7A] font-mono text-lg leading-relaxed mt-15">
        <pre className="text-right pr-4 select-none text-[#993C7A]">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={`instructions-line-${i + 1}`}>{i + 1}</div>
          ))}
        </pre>
        <pre className="whitespace-pre-wrap text-[#E097CE]">
          {`Before you dive into showcasing your creativity, please take a moment to read the following instructions carefully\n⁠After answering a question, click on "Save Answer".\nYou can save multiple times and only your most recent saved answer will be considered.\nYou can apply to a maximum of three Areas of Interest (AOIs) within the Design Domain.\nTo know more about each AOI, head over to the AOI Page from the navigation bar for detailed information.\nThat’s it! Trust your instincts, play with ideas, and let creativity take the wheel. And hey don’t forget to have fun while you’re at it!`}
        </pre>
      </div>
    </div>
  );
}
