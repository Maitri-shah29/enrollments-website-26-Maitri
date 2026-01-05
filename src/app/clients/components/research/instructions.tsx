"use client";

import NetworkGraph from "./network-graph";

export default function Instructions() {
  return (
    <div className="relative w-full min-h-screen bg-[#1A1A1A] text-white overflow-hidden">
      {/* Background Graph (interactive) */}
      <div className="absolute inset-0 z-0">
        <NetworkGraph />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 px-[4vw] py-[5vh] max-w-7xl">
        <h1 className="text-[clamp(2rem,1.5vw,1.25rem)] font-semibold text-[#C8B7FF] mb-[1vh] font-monopoly-bold">
          Round 2 Instructions
        </h1>

        <div className="text-gray-300 leading-relaxed text-justify font-monopoly text-[clamp(1.2rem,1.2vw,1rem)] space-y-5">
          <p>
            <span className="text-[#C8B7FF] font-semibold">Round 2</span>{" "}
            scheduling is now open for promoted candidates.
          </p>
          <p>
            Open the Scheduler from the header or type{" "}
            <span className="text-[#C8B7FF] font-semibold">scheduler.com</span>{" "}
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
              className="inline-flex items-center justify-center px-6 py-2 bg-[#7D5BED] text-white rounded-full font-monopoly text-base hover:bg-[#6b4fde] transition-colors"
            >
              Open Scheduler
            </button>
          </div>
          <p className="font-semibold text-[#C8B7FF]">Booking steps:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Select the domain(s) you applied for.</li>
            <li>
              Choose a date from the{" "}
              <span className="text-[#C8B7FF] font-semibold">calendar</span>{" "}
              (blue dots show availability).
            </li>
            <li>Pick a time slot.</li>
            <li>
              Click{" "}
              <span className="text-[#C8B7FF] font-semibold">Confirm</span> to
              lock your slot. It will appear below after confirmation.
            </li>
          </ol>
          <p>
            <span className="text-[#C8B7FF] font-semibold">Note:</span>{" "}
            Confirmed slots cannot be changed. If everything looks full, check
            back for newly opened slots.
          </p>
        </div>
      </div>
    </div>
  );
}
