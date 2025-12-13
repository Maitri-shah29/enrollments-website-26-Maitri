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
          draggable={false}
        />
      </div>
      <div className="flex text-[#993C7A] font-mono text-lg leading-relaxed mt-15">
        {/* <pre className="text-right pr-4 select-none text-[#993C7A]">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={`instructions-line-${i + 1}`}>{i + 1}</div>
          ))}
        </pre> */}
        <pre className="whitespace-pre-wrap text-[#E097CE]">
          {`1. Go to the Explore tab on the left sidebar and join up to 3 AoIs based on your preferences.
2. Proceed to Round 1. Answer the common questions first, and then the domain-wise questions. 
3. Make sure you click on Save after every answer. If you see the "Saved Successfully" popup on the top right, your answer has been saved.
4. After answering all questions, click on ‘Submit Form’ at the bottom of the left sidebar.

Bonus - You will be judged on your technical skills but more importantly, on your ability to quickly learn new concepts. Points will be given for originality.

All the Best!`}
        </pre>
      </div>
    </div>
  );
}
