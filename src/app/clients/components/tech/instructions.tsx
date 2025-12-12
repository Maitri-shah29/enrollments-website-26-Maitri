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
          {`1. Go to the explore tab on the left sidebar and join upto 2 areas of interest according to your preferences.
2. Proceed to Round 1 from the left sidebar
3. Answer the common questions first, make sure to click on save after every answer.
4. If you see the "saved successfully" popup on the top right, your answer has been saved.
5. Answer the domain-wise questions next, ensure that you click on save after every answer.
6. After answering all questions, click on submit form at the bottom of the left sidebar.
7. You will be judged on your technical skills but more importantly on your ability to quickly learn new concepts. Points will be given for originality.

All the Best!`}
        </pre>
      </div>
    </div>
  );
}
