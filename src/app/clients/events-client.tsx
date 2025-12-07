"use client";
import Image from "next/image";

const Events = () => {
  const handleNavigate = (url: string) => {
    window.parent.postMessage({ type: "NAVIGATE_TO", url: url }, "*");
  };
  return (
    <div className="bg-gradient-to-br from-black via-gray-950 to-black w-full min-h-screen text-white font-doppio overflow-hidden hide-scrollbar p-20 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-0 w-[600px] h-[600px] bg-emerald-500/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 right-0 w-[550px] h-[550px] bg-cyan-500/30 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-20 left-1/4 w-[500px] h-[500px] bg-purple-500/25 rounded-full blur-[120px] animate-pulse [animation-delay:0.5s]" />
        <div className="absolute top-2/3 left-1/2 w-[400px] h-[400px] bg-orange-500/20 rounded-full blur-[100px] animate-pulse [animation-delay:1.5s]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <header className="px-8 pt-8 flex items-center mb-16 relative z-10">
        <div className="relative w-70 h-30 flex-shrink-0">
          <Image
            src="/images/acmlogo.svg"
            alt="ACM VIT Logo"
            fill
            className="object-contain"
          />
        </div>
        <h2 className="flex-1 text-center text-6xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg">
          Events and Projects
        </h2>
        <div className="w-70 flex-shrink-0"></div>
      </header>

      <main className="max-w-450 mx-auto px-0 pt-6 pb-12 relative z-10">
        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem] cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          onClick={() => handleNavigate("https://c2c.acmvit.in")}
        >
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl overflow-hidden relative h-55 border-2 border-emerald-500/50 group-hover:border-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-300">
              <Image
                fill
                src="/images/events/c2c.svg"
                alt="C2C"
                className="object-contain"
              />
            </div>
          </div>
          <div className="w-1/2 text-gray-300 text-2xl group-hover:text-white transition-colors duration-300">
            <p>
              Code2Create, a 36 hour long hackathon, is ACM-VIT's flagship event
              and one of the grandest annual events hosted in VIT.
            </p>
          </div>
        </section>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem] cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          onClick={() => handleNavigate("https://cryptichunt.acmvit.in")}
        >
          <div className="w-3/5 text-gray-300 text-2xl group-hover:text-white transition-colors duration-300">
            <p>
              graVITas' most participated event, Cryptic Hunt is ACM's elaborate
              scavenger hunt which mastery of logic and tech.
            </p>
          </div>
          <div className="w-1/2 mb-6 ml-6">
            <div className="rounded-xl overflow-hidden relative h-57.5 border-2 border-orange-500/50 group-hover:border-orange-400 group-hover:shadow-lg group-hover:shadow-orange-500/20 transition-all duration-300">
              <Image
                fill
                src="/images/events/ch.svg"
                alt="Cryptic hunt"
                className="object-contain"
              />
            </div>
          </div>
        </section>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem] cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          onClick={() => handleNavigate("https://rcpc.acmvit.in/")}
        >
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl overflow-hidden relative h-55 border-2 border-purple-500/50 group-hover:border-purple-400 group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-all duration-300">
              <Image
                fill
                src="/images/events/rc.svg"
                alt="RC"
                className="object-contain"
              />
            </div>
          </div>
          <div className="w-1/2 text-gray-300 text-2xl group-hover:text-white transition-colors duration-300">
            <p>
              Competitive coding event with a twist, ACM's Reverse Coding
              requires participants to quirkily reverse engineer solutions.
            </p>
          </div>
        </section>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem] cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          onClick={() => handleNavigate("https://examcooker.acmvit.in")}
        >
          <div className="w-3/5 text-gray-300 text-2xl group-hover:text-white transition-colors duration-300">
            <p>
              Your one-stop solution to Cram before Exams with its curated
              resources, notes and previous year question papers. Perfect for
              last minute revision!
            </p>
          </div>
          <div className="w-1/2 mb-6 ml-6">
            <div className="rounded-xl overflow-hidden relative h-57.5 border-2 border-blue-500/50 group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
              <Image
                src="/images/events/examcooker.svg"
                alt="Examcooker"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </section>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem] cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          onClick={() => handleNavigate("https://unipool.acmvit.in")}
        >
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl overflow-hidden relative h-55 border-2 border-green-500/50 group-hover:border-green-400 group-hover:shadow-lg group-hover:shadow-green-500/20 transition-all duration-300">
              <Image
                src="/images/events/unipool.svg"
                alt="Unipool"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <div className="w-1/2 text-gray-300 text-2xl group-hover:text-white transition-colors duration-300">
            <p>
              Simplistic app for VITians to share cab rides and split costs
              during travel.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Events;
