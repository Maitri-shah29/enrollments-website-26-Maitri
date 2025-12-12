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
          {Array.from({ length: 4 }, (_, i) => (
            <div key={`instructions-line-${i + 1}`}>{i + 1}</div>
          ))}
        </pre>
        <pre className="whitespace-pre-wrap text-[#E097CE]">
          {`Welcome to the first round of ACM-VIT’s Tech Domain recruitment! This is your chance to show your technical skills, problem-solving mindset, and interest in building real solutions. You can choose up to two AOIs that match your strengths and goals. Answer the questions, review your responses, and submit when ready. We’re looking for solid fundamentals, curiosity, and a drive to build. Good luck!`}
        </pre>
      </div>
    </div>
  );
}
