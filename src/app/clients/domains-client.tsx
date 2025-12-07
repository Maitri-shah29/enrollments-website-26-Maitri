"use client";
import Image from "next/image";
import type React from "react";

const Domains: React.FC = () => {
  const handleNavigate = (url: string) => {
    window.parent.postMessage({ type: "NAVIGATE_TO", url: url }, "*");
  };

  return (
    <div className="bg-gradient-to-br from-black via-gray-950 to-black w-full min-h-screen text-white font-doppio overflow-hidden hide-scrollbar p-20 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-0 w-[600px] h-[600px] bg-lime-500/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 right-0 w-[550px] h-[550px] bg-blue-500/30 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-20 left-1/4 w-[500px] h-[500px] bg-pink-500/25 rounded-full blur-[120px] animate-pulse [animation-delay:0.5s]" />
        <div className="absolute top-2/3 left-1/2 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse [animation-delay:1.5s]" />
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
          Domains
        </h2>
        <div className="w-70 flex-shrink-0"></div>
      </header>

      <main className="max-w-450 mx-auto px-0 pt-6 pb-12 relative z-10">
        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem] cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          onClick={() => handleNavigate("cc")}
        >
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl border-2 border-lime-500/50 group-hover:border-lime-400 group-hover:shadow-lg group-hover:shadow-lime-500/20 overflow-hidden relative h-60 transition-all duration-300">
              <Image
                fill
                src="/images/domains/cc.svg"
                alt="Competitive Coding"
                className="object-cover opacity-60"
              />
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                Competitive Coding
              </span>
            </div>
          </div>
          <div className="w-1/2 text-gray-300 text-2xl group-hover:text-white transition-colors duration-300">
            <p>
              Master algorithmic thinking and problem-solving through rigorous
              competitive coding. Our members tackle complex data structures and
              algorithms while building speed and precision in high-stakes
              programming contests.
            </p>
          </div>
        </section>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem] cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          onClick={() => handleNavigate("design")}
        >
          <div className="w-3/5 text-gray-300 text-2xl group-hover:text-white transition-colors duration-300">
            <p>
              Craft beautiful digital experiences through design. From UI/UX to
              motion graphics, illustrations to 3D design, our designers bring
              creative visions to life with stunning visual storytelling.
            </p>
          </div>
          <div className="w-1/2 mb-6 ml-6">
            <div className="rounded-xl border-2 border-blue-500/50 group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-500/20 overflow-hidden relative h-60 transition-all duration-300">
              <Image
                fill
                src="/images/domains/design.svg"
                alt="Design"
                className="object-cover opacity-60"
              />
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                Design
              </span>
            </div>
          </div>
        </section>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem] cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          onClick={() => handleNavigate("management")}
        >
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl border-2 border-red-500/50 group-hover:border-red-400 group-hover:shadow-lg group-hover:shadow-red-500/20 overflow-hidden relative h-60 transition-all duration-300">
              <Image
                fill
                src="/images/domains/management.svg"
                alt="Management"
                className="object-cover opacity-60"
              />
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                Management
              </span>
            </div>
          </div>
          <div className="w-1/2 text-gray-300 text-2xl group-hover:text-white transition-colors duration-300">
            <p>
              Transform big ideas into unforgettable events. We handle
              everything from brainstorming and sponsorships to logistics and
              content creation. We're the extroverts ensuring every event is
              smooth, well-organized, and unforgettable.
            </p>
          </div>
        </section>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem] cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          onClick={() => handleNavigate("research")}
        >
          <div className="w-3/5 text-gray-300 text-2xl group-hover:text-white transition-colors duration-300">
            <p>
              Foster curiosity and innovation across cutting-edge fields. From
              AI and Blockchain to Quantum Computing and Bioinformatics, we
              bridge theory and real-world application through collaboration and
              continuous learning.
            </p>
          </div>
          <div className="w-1/2 mb-6 ml-6">
            <div className="rounded-xl border-2 border-purple-500/50 group-hover:border-purple-400 group-hover:shadow-lg group-hover:shadow-purple-500/20 overflow-hidden relative h-60 transition-all duration-300">
              <Image
                src="/images/domains/research.svg"
                alt="Research"
                fill
                className="object-cover opacity-60"
              />
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                Research
              </span>
            </div>
          </div>
        </section>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem] cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          onClick={() => handleNavigate("tech")}
        >
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl border-2 border-pink-500/50 group-hover:border-pink-400 group-hover:shadow-lg group-hover:shadow-pink-500/20 overflow-hidden relative h-60 transition-all duration-300">
              <Image
                src="/images/domains/tech.svg"
                alt="Tech"
                fill
                className="object-cover opacity-60"
              />
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                Tech
              </span>
            </div>
          </div>
          <div className="w-1/2 text-gray-300 text-2xl group-hover:text-white transition-colors duration-300">
            <p>
              Build the future with cutting-edge technology. From web and app
              development to DevOps and open-source contribution, our members
              master full-stack solutions and modern development practices.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Domains;
