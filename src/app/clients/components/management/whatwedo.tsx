import Image from "next/image";
import Header from "./header";

export default function WhatWeDo() {
  return (
    <div className="relative bg-white opacity-[70%] backdrop-blur-md rounded-2xl w-[90%] h-[90%] shadow-lg overflow-hidden">
      <Header />
      <div className="p-10 overflow-y-auto h-full">
        <h1 className="text-2xl sm:text-3xl font-medium text-black text-left mb-8">
          What Do We Do???
        </h1>
        {/* Email Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Image src="/profile-icon.svg" alt="User" width={50} height={50} />
            <div>
              <p className="text-black font-medium">Mgmt</p>
              <p className="text-sm text-gray-700">
                &lt;loremipsum@gmail.com&gt;
              </p>
              <p className="text-sm text-gray-700">to me ▾</p>
            </div>
          </div>
        </div>
        {/* Dynamic Content */}
        <div className="text-black leading-relaxed space-y-4 text-base">
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
