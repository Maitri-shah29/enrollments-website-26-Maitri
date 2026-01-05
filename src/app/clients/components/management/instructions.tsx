"use client";

import Image from "next/image";
import Header from "./header";

interface InstructionsProps {
  onBack?: () => void;
}

export default function Instructions({ onBack }: InstructionsProps) {
  return (
    <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-[100%] h-[90%] shadow-lg flex flex-col overflow-auto">
      <Header onClick={onBack} />
      <div className="px-10 py-5 overflow-y-auto h-full">
        <h1 className="text-2xl text-black mb-1">Round 2 Instructions</h1>

        {/* Email Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Image src="/profile-icon.svg" alt="User" width={40} height={40} />
            <div>
              <p className="text-black font-medium text-sm">Management</p>
              <p className="text-xs text-gray-700">
                &lt;management@acmvit.in&gt;
              </p>
              <p className="text-xs text-gray-700">to me ▾</p>
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="text-black leading-relaxed space-y-4 text-base mt-5">
          <p>
            <span className="font-semibold">Round 2</span> scheduling is now
            open for promoted candidates.
          </p>
          <p>
            Open the Scheduler from the header or type{" "}
            <span className="font-semibold">scheduler.com</span> in the search
            bar to book your meet.
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
              className="inline-flex items-center justify-center px-6 py-2 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Open Scheduler
            </button>
          </div>
          <p className="font-semibold">Booking steps:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Select the domain(s) you applied for.</li>
            <li>
              Choose a date from the{" "}
              <span className="font-semibold">calendar</span> (blue dots show
              availability).
            </li>
            <li>Pick a time slot.</li>
            <li>
              Click <span className="font-semibold">Confirm</span> to lock your
              slot. It will appear below after confirmation.
            </li>
          </ol>
          <p>
            <span className="font-semibold">Note:</span> Confirmed slots cannot
            be changed. If everything looks full, check back for newly opened
            slots.
          </p>
        </div>
      </div>
    </div>
  );
}
