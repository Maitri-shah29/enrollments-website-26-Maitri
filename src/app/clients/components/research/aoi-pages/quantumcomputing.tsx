"use client";

import Image from "next/image";
import type React from "react";
import NetworkGraph from "../network-graph";

const quantumcomputingPage: React.FC = () => {
  return (
    <div className="relative flex w-full h-full bg-[#1A1A1A] overflow-hidden">
      <NetworkGraph />

      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-10 z-10 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-6xl font-bold text-[#C8B7FF] mb-4 sm:mb-6 md:mb-10">
          Quantum Computing
        </h1>
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto pr-2 sm:pr-4">
          <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed">
            The Quantum Computing AOI explores the future of computation beyond
            classical boundaries. Members learn about qubits, entanglement, and
            quantum algorithms, experimenting with cutting-edge research that is
            redefining how we approach complex problem-solving.
          </p>
        </div>
      </div>
    </div>
  );
};

export default quantumcomputingPage;
