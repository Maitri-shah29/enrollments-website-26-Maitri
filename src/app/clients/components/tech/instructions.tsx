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
          {`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate.`}
        </pre>
      </div>
    </div>
  );
}
