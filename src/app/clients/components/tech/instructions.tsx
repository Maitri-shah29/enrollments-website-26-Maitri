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
      <div className="flex text-[#993C7A] font-mono text-lg leading-relaxed mt-10">
        <div className="text-[#E097CE] max-w-3xl space-y-6">
          <p>
            <span className="text-[#993C7A] font-semibold">Round 2</span>{" "}
            scheduling is now open for promoted candidates.
          </p>
          <p>
            Open the Scheduler from the header or type{" "}
            <span className="text-[#993C7A] font-semibold">scheduler.com</span>{" "}
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
              className="inline-flex items-center justify-center px-6 py-2 bg-[#993C7A] text-white rounded-full font-mono text-base hover:bg-[#b84a92] transition-colors"
            >
              Open Scheduler
            </button>
          </div>
          <p className="font-semibold">Booking steps:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Select the domain(s) you applied for.</li>
            <li>
              Choose a date from the{" "}
              <span className="text-[#993C7A] font-semibold">calendar</span>{" "}
              (blue dots show availability).
            </li>
            <li>Pick a time slot.</li>
            <li>
              Click{" "}
              <span className="text-[#993C7A] font-semibold">Confirm</span> to
              lock your slot. It will appear below after confirmation.
            </li>
          </ol>
          <p>
            <span className="text-[#993C7A] font-semibold">Note:</span>{" "}
            Confirmed slots cannot be changed. If everything looks full, check
            back for newly opened slots.
          </p>
        </div>
      </div>
    </div>
  );
}
