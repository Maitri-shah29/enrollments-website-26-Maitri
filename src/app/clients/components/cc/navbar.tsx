"use client";
import Image from "next/image";
import { useState } from "react";
import ACMText from "../../../../../public/images/ACM logo text.svg";
import ACMLogo from "../../../../../public/images/ACM-VIT Logo.png";

const CCNavBar = () => {
  const [activeButton, setActiveButton] = useState<string>("About");

  const buttons: string[] = [
    "About",
    "Instructions",
    "Questions",
    "Contest",
    "Interview",
  ];

  return (
    <div className="flex justify-center items-center w-full">
      <div className="flex justify-center items-center ml-15 mr-1">
        <Image src={ACMLogo} height={100} width={100} alt="ACM logo" />
        <Image src={ACMText} height={40} width={100} alt="ACM logo" />
      </div>
      <div className="flex w-[75%] mx-auto transform skew-x-30 h-fit justify-end items-end">
        <div className="flex items-center justify-center bg-[#C9EB3E] py-0.5 gap-3 w-full px-0.5 font-ShareTechMono">
          {buttons.map((button, index) => (
            <button
              key={button}
              type="button"
              onClick={() => setActiveButton(button)}
              className={`px-3 pt-4 pb-2 border-0 text-lg font-medium flex-1 transition-all duration-180 ease-in ${
                activeButton === button
                  ? "bg-[#C9EB3E] text-[#16171B]"
                  : "bg-[#16171B] text-[#C9EB3E]"
              }`}
              style={{
                marginRight: index === buttons.length - 1 ? "0" : "-10px",
              }}
            >
              <span
                className="inline-block -skew-x-30"
                style={{ fontFamily: "var(--font-share-tech)" }}
              >
                {button}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CCNavBar;
