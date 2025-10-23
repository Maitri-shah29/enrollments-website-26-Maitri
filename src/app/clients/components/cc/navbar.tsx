"use client";
import { useState } from "react";

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
    <div className="w-[95%] mx-auto transform skew-x-30">
      <div className="flex items-center justify-center bg-[#C9EB3E] py-0.5 gap-3 w-full px-0.5 font-ShareTechMono">
        {buttons.map((button, index) => (
          <button
            key={button}
            type="button"
            onClick={() => setActiveButton(button)}
            className={`px-3 pt-7 pb-2 border-0 text-lg font-medium flex-1 transition-colors ${
              activeButton === button
                ? "bg-[#C9EB3E] text-black"
                : "bg-black text-[#C9EB3E] hover:bg-[#C9EB3E] hover:text-black"
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
  );
};

export default CCNavBar;
