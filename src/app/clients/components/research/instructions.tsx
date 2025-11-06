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
      <div className="relative z-10 px-16 py-20 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-semibold text-purple-400 mb-4">
          Instructions
        </h1>

        <p className="text-gray-300 leading-relaxed text-justify">
          Lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem
          ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
          lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem
          ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
          lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem
          ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
          lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem
          ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum.
          <br />
          <br />
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin
          vulputate ex in urna interdum, sed faucibus sem maximus. Integer
          blandit, purus ac sodales vestibulum, erat est tincidunt augue, a
          fermentum velit nisl id nisl. Vivamus blandit arcu at lectus
          dignissim, sed cursus ex elementum. Suspendisse ac justo nec eros
          suscipit malesuada. Duis ac ex sed justo tempor convallis ut id mi.
        </p>
      </div>
    </div>
  );
}
