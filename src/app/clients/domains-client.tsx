import Image from "next/image";
import type React from "react";

const Domains: React.FC = () => {
  const handleNavigate = (url: string) => {
    window.parent.postMessage({ type: "NAVIGATE_TO", url: url }, "*");
  };

  return (
    <div className="bg-black w-full min-h-screen text-white font-doppio overflow-hidden hide-scrollbar p-20">
      <header className="px-8 pt-8">
        <h1 className="text-5xl font-bold drop-shadow-sm">ACM - VIT</h1>
      </header>

      <main className="max-w-450 mx-auto px-0 pt-6 pb-12">
        <h2 className="text-center text-6xl font-bold mb-20 text-black [text-shadow:2px_2px_0_#fff,2px_-2px_0_#fff,-2px_2px_0_#fff,-2px_-2px_0_#fff,4px_4px_0_#fff,-4px_-4px_0_#fff,4px_-4px_0_#fff,-4px_4px_0_#fff]">
          <span>Domains</span>
        </h2>

        <section
          className="flex flex-row items-center mb-20 gap-[7.5rem]"
          onClick={() => handleNavigate("cc")}
        >
          <div className="w-2/5 mb-6 mr-6">
            <div className="rounded-xl border-4 border-lime-300 overflow-hidden relative h-60 cursor-pointer hover:opacity-90 transition-opacity">
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
          <div className="w-1/2 text-gray-300 text-2xl">
            <p>
              Master algorithmic thinking and problem-solving through rigorous
              competitive coding. Our members tackle complex data structures and
              algorithms while building speed and precision in high-stakes
              programming contests.
            </p>
          </div>
        </section>

        <section className="flex flex-row items-center mb-20 gap-[7.5rem]">
          <div className="w-3/5 text-gray-300 text-2xl">
            <p>
              Craft beautiful digital experiences through design. From UI/UX to
              motion graphics, illustrations to 3D design, our designers bring
              creative visions to life with stunning visual storytelling.
            </p>
          </div>
          <div className="w-1/2 mb-6 ml-6">
            <div
              onClick={() => handleNavigate("design")}
              className="rounded-xl border-4 border-[#013D62] overflow-hidden relative h-60 cursor-pointer hover:opacity-90 transition-opacity"
            >
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

        <section className="flex flex-row items-center mb-20 gap-[7.5rem]">
          <div className="w-2/5 mb-6 mr-6">
            <div
              onClick={() => handleNavigate("management")}
              className="rounded-xl border-4 border-red-400 overflow-hidden relative h-60 cursor-pointer hover:opacity-90 transition-opacity"
            >
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
          <div className="w-1/2 text-gray-300 text-2xl">
            <p>
              Transform big ideas into unforgettable events. We handle
              everything from brainstorming and sponsorships to logistics and
              content creation. We're the extroverts ensuring every event is
              smooth, well-organized, and unforgettable.
            </p>
          </div>
        </section>

        <section className="flex flex-row items-center mb-20 gap-[7.5rem]">
          <div className="w-3/5 text-gray-300 text-2xl">
            <p>
              Foster curiosity and innovation across cutting-edge fields. From
              AI and Blockchain to Quantum Computing and Bioinformatics, we
              bridge theory and real-world application through collaboration and
              continuous learning.
            </p>
          </div>
          <div className="w-1/2 mb-6 ml-6">
            <div
              onClick={() => handleNavigate("research")}
              className="rounded-xl border-4 border-[#521D4E] overflow-hidden relative h-60 cursor-pointer hover:opacity-90 transition-opacity"
            >
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

        <section className="flex flex-row items-center mb-20 gap-[7.5rem]">
          <div className="w-2/5 mb-6 mr-6">
            <div
              onClick={() => handleNavigate("tech")}
              className="rounded-xl border-4 border-[#FF53A7] overflow-hidden relative h-60 cursor-pointer hover:opacity-90 transition-opacity"
            >
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
          <div className="w-1/2 text-gray-300 text-2xl">
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
