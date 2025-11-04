"use client";
import Image from "next/image";

export default function About() {
  return (
    <div className="bg-[#08111D] p-4 rounded-lg">
      <Image
        src="/images/about-tech.svg"
        alt="acm logo"
        width={700}
        height={700}
      />
      <div className="flex text-[#993C7A] font-mono text-lg leading-relaxed mt-15">
        <pre className="text-right pr-4 select-none text-[#993C7A]">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={`about-line-${i + 1}`}>{i + 1}</div>
          ))}
        </pre>

        <pre className="text-white whitespace-pre-wrap">
          {`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vel nisi at nisl luctus tincidunt. Aliquam semper erat et nibh scelerisque vulputate.`}
        </pre>
      </div>
    </div>
  );
}
