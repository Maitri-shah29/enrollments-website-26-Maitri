"use client";

import Image from "next/image";
import type React from "react";

const Instructions: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-start flex-col px-[5%] pb-[3%] overflow-y-auto [--scrollbar-thumb:#F55F4B]">
      <h1 className="text-[8vh] lg:text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0 mb-[1.5%]">
        Round 2 Instructions
      </h1>

      <div className="flex flex-col lg:flex-row justify-center items-center gap-[3%] w-full">
        <div className="relative flex-1 w-full lg:w-auto">
          <Image
            src="/images/design/instructions_graphic.svg"
            alt="About Graphic"
            width={500}
            height={500}
            className="w-[8%] lg:w-[10%] absolute -top-7 -left-7"
            draggable={false}
          />
          <div className="px-[5%] lg:px-[8%] pt-[5%] font-coolvetica text-2xl text-white space-y-6">
            <p>
              <span className="text-[#F55F4B] font-semibold">Round 2</span>{" "}
              scheduling is now open for promoted candidates.
            </p>
            <p>
              Open the Scheduler from the header or type{" "}
              <span className="text-[#F55F4B] font-semibold">
                scheduler.com
              </span>{" "}
              in the search bar to book your meet.
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  window.parent.postMessage(
                    { type: "NAVIGATE_TO", url: "scheduler.com" },
                    "*",
                  );
                }}
                className="inline-flex items-center justify-center px-6 py-3 bg-[#F55F4B] text-white rounded-full font-coolvetica text-xl hover:bg-[#ff7a68] transition-colors"
              >
                Open Scheduler
              </button>
            </div>
            <p className="font-semibold">Booking steps:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Pick the domain(s) you applied for.</li>
              <li>
                Choose a date from the{" "}
                <span className="text-[#F55F4B] font-semibold">calendar</span>{" "}
                (blue dots show availability).
              </li>
              <li>Select a time slot.</li>
              <li>
                Click{" "}
                <span className="text-[#F55F4B] font-semibold">Confirm</span> to
                lock your slot. It will appear below once confirmed.
              </li>
            </ol>
            <p>
              <span className="text-[#F55F4B] font-semibold">Note:</span> Once a
              slot is confirmed, it cannot be changed. If everything looks
              booked, check back soon for newly opened slots.
            </p>
          </div>
        </div>
        <Image
          src="/images/design/instructions_post.svg"
          alt="About Graphic"
          width={500}
          height={500}
          className="w-[60%] lg:w-[30%] mx-auto lg:mx-0 lg:mr-[3%] mt-[3%] lg:mt-0"
          draggable={false}
        />
      </div>
    </div>
  );
};

export default Instructions;
