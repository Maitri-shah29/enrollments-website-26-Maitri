"use client";

import Image from "next/image";
import type React from "react";
import NetworkGraph from "../network-graph";

const cybersecPage: React.FC = () => {
  return (
    <div className="relative flex w-full h-full bg-[#1A1A1A] overflow-hidden">
      <NetworkGraph />

      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-10 z-10 max-w-4xl">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#C8B7FF] mb-4 sm:mb-6 md:mb-10">
          Cybersecurity
        </h1>
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto pr-2 sm:pr-4">
          <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed mb-4">
            Cybersecurity focuses on defending digital systems. Members learn
            how attackers think, how to uncover vulnerabilities, and how to
            build stronger, safer environments.
          </p>
          <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed font-semibold mb-2">
            Focus Areas:
          </p>
          <ul className="text-white text-sm sm:text-base md:text-lg leading-relaxed list-disc list-inside space-y-1">
            <li>Ethical hacking</li>
            <li>Cryptography basics</li>
            <li>Secure networks & applications</li>
            <li>Malware & threat analysis</li>
            <li>Incident response</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default cybersecPage;
