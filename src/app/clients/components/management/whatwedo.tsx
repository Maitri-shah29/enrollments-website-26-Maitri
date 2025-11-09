import Image from "next/image";
import Header from "./header";

export default function WhatWeDo() {
  return (
    <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-[100%] h-[90%] shadow-lg flex flex-col overflow-auto">
      <Header />
      <div className="px-10 py-5 overflow-y-auto h-full">
        <h1 className="text-2xl text-black mb-1">What We Do</h1>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Image src="/profile-icon.svg" alt="User" width={40} height={40} />
            <div>
              <p className="text-black font-medium text-sm">Management</p>
              <p className="text-xs text-gray-700">
                &lt;loremipsum@acmvit.in&gt;
              </p>
              <p className="text-xs text-gray-700">to me ▾</p>
            </div>
          </div>
        </div>

        <div className="text-black leading-relaxed space-y-4 text-base mt-5">
          <p>
            <strong>Marketing —</strong> We create all the hype around our
            events. We make sure every event looks amazing and gets the
            attention it deserves. I can't remember the last conversation where
            I didn't mention ExamCooker — because marketing shouldn't stop,
            right? Posters, captions, PR strategies — we do it all.
          </p>

          <p>
            <strong>Finance and Marketing —</strong> We secure funding, manage
            budgets, and make sure every penny is used wisely. Freebies, guest
            speakers, cool setups? You're welcome.
          </p>

          <p>
            <strong>Logistics and Operations —</strong> From booking venues and
            arranging extensions to getting the required permissions from
            authorities, we handle everything so that all events are a hit.
          </p>
        </div>
      </div>
    </div>
  );
}
