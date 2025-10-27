import Image from "next/image";
import type React from "react";
import NeonSection from "./neon-section";

const Instructions: React.FC = () => {
  return (
    <>
      <NeonSection title="Instructions">
        <ul className="list-disc pl-6 space-y-2 text-white">
          <li>Next round will be a CC contest round.</li>
          <li>It will be organised on Sunday, 30th March, 2025.</li>
          <li>Timings will be 9:00 pm to 11:00 pm.</li>
          <li>
            Contest link is{" "}
            <a
              href="https://hackerrank.com/acmvit-enrollments"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C9EB3E] underline"
            >
              hackerrank.com/acmvit-enrollments
            </a>
          </li>
        </ul>
      </NeonSection>

      <NeonSection title="Resources">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              img: "/images/rc.svg",
              title: "Reverse Coding",
              desc: "Reverse-engineering problems to sharpen logic.",
              href: "https://rcpc.acmvit.in/",
            },
            {
              img: "/images/codepp.svg",
              title: "Code Plus Plus",
              desc: "Hands-on pair coding and advanced problems.",
              href: "https://codeplusplus.acmvit.in/",
            },
            {
              img: "/images/icpc.svg",
              title: "ACM ICPC",
              desc: "Team-based algorithmic challenges and prep.",
              href: "https://icpc.global/",
            },
          ].map((r) => {
            const bgStyle: React.CSSProperties = {
              backgroundImage: `url('${r.img}')`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            };

            if (r.img.endsWith("rc.svg")) {
              bgStyle.backgroundSize = "contain";
              bgStyle.backgroundPosition = "left center";
              bgStyle.backgroundColor = "#242527";
            }
            if (r.img.endsWith("icpc.svg")) {
              bgStyle.backgroundSize = "contain";
              bgStyle.backgroundPosition = "center";
              bgStyle.backgroundColor = "#242527";
            }

            return (
              <div
                key={r.title}
                className="relative rounded overflow-hidden border-4 border-[#242527] h-48 md:h-64 lg:h-80"
              >
                <div
                  className="absolute inset-0"
                  style={bgStyle}
                  aria-hidden={true}
                ></div>
                <div className="absolute inset-0 bg-black/40" />

                <div className="absolute bottom-6 left-6">
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${r.title}`}
                    className="flex items-center gap-3 bg-white/10 text-white px-6 py-3 rounded-full backdrop-blur-sm hover:bg-white/20 transition font-ShareTechMono"
                  >
                    <span className="text-lg">▶</span>
                    <span className="text-sm">{r.title}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <h3 className="text-white font-ShareTechMono text-lg mb-4">
            Study Plan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Neetcode 150",
                note: "150 curated problems across topics.",
              },
              {
                title: "Striver's A2Z",
                note: "Comprehensive topic-wise practice.",
              },
              {
                title: "AlgoMap",
                note: "Graphical roadmap for learning algorithms.",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="bg-[#121212] p-4 rounded border-4 border-[#242527] flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-[#0e0e0e] rounded flex items-center justify-center">
                  <Image
                    src="/images/san.svg"
                    alt="resource"
                    width={48}
                    height={48}
                    className="w-12 h-12"
                  />
                </div>
                <div>
                  <div className="text-white font-ShareTechMono font-semibold">
                    {s.title}
                  </div>
                  <div className="text-[#9a9a9a] text-sm">{s.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </NeonSection>
    </>
  );
};

export default Instructions;
