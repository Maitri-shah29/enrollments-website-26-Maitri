"use client";
import Image from "next/image";
import { useState } from "react";
import FolderDesignBig from "@/app/components/folder-design-big";

interface EventData {
  id: number;
  title: string;
  logo: React.ReactNode;
  description: string;
  color: string;
  logoScale?: number;
  textColor?: string;
}

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const eventsData: EventData[] = [
    {
      id: 1,
      title: "CODE2CREATE",
      logoScale: 1.4,
      textColor: "#fff",
      logo: <Image src="Group.svg" alt="c2c logo" width={120} height={120} />,
      description:
        "Code2Create is ACM-VIT's flagship 48-hour national hackathon and one of the largest  events hosted in VIT. Bringing together thousands of innovative minds, participants collaborate intensively to build groundbreaking solutions, competing for exciting prizes while networking with industry mentors.",
      color: "#5EBF94",
    },
    {
      id: 2,
      title: "CRYPTIC HUNT",
      logoScale: 1.3,
      textColor: "#FFFFFF",
      logo: (
        <Image
          src="owls assemble.svg"
          alt="crytptic hunt"
          width={120}
          height={120}
        />
      ),
      description:
        "Cryptic Hunt is ACM's elaborate app-based scavenger hunt which demands mastery of logic and creative thinking. Participants solve cryptic puzzles, riddles, and mind-bending challenges by scanning QR codes placed all over the campus. Teams race against time and fellow hunters to decode clues and climb the leaderboard.",
      color: "#E67E50",
    },
    {
      id: 3,
      title: "EXAMCOOKER",
      logoScale: 1.7,
      textColor: "#FFFFFF",
      logo: (
        <Image
          src="exam-cooker-logo.svg"
          alt="ExamCooker"
          width={120}
          height={120}
        />
      ),
      description:
        "ACM-VIT's comprehensive platform for VITians to access previous year question papers and curated notes for every subject. The site helps students prepare effectively for exams by enabling them to understand exam patterns, practice past questions, and ace their academics with confidence.",
      color: "#5B9FD8",
    },
    {
      id: 4,
      title: "UNIPOOL",
      logoScale: 1.5,
      textColor: "#FFFFFF",
      logo: (
        <Image
          src="/UniPool 2.0 Logo (1).svg"
          alt="Unipool"
          width={120}
          height={120}
        />
      ),
      description:
        "An ACM-VIT initiative for users to share cab rides and split costs during travel. The platform provides real-time ride matching, secure payment splitting, and secure authorization, making commutes to airports, railway stations, and weekend destinations more affordable and sustainable for students.",
      color: "#C8D96F",
    },
    {
      id: 5,
      title: "REVERSE CODING",
      logoScale: 2.1,
      textColor: "#FFFFFF",
      logo: (
        <Image src="Vector.svg" alt="Reverse Coding" width={120} height={120} />
      ),
      description:
        "Competitive coding with a twist, ACM's Reverse Coding requires participants to reverse engineer solutions. Instead of solving problems traditionally, coders must work backwards from expected outputs to deduce the original problem statement, testing their analytical thinking and pattern recognition in this brain-teasing competition.",
      color: "#9B6FB0",
    },
    {
      id: 6,
      title: "FORKTOBER",
      logoScale: 2,
      textColor: "#FFFFFF",
      logo: (
        <Image
          src="forktober logo.svg"
          alt="Forktober"
          width={120}
          height={120}
        />
      ),
      description:
        "Annual open-source contribution challenge where participants contribute to real-world projects. Learn collaborative development, version control, and make meaningful contributions to the tech community.",
      color: "#4A5F7F",
    },
    {
      id: 7,
      title: "INSPIHER",
      logoScale: 2.5,
      textColor: "#FFFFFF",
      logo: (
        <Image src="inspiher.svg" alt="Insipher" width={120} height={120} />
      ),
      description:
        "The InspiHER Podcast series has always been about more than just conversations; it’s about connection, empowerment, and igniting ambition. This year, we’re raising the bar. With an expanded lineup of remarkable women leaders from across the globe, we aim to amplify diverse voices and share stories that matter — stories of resilience, innovation, leadership, and the unwavering spirit that fuels change.",
      color: "#FF6B6B",
    },
    {
      id: 8,
      title: "THE TINY HACK",
      logoScale: 1.4,
      textColor: "#FFFFFF",
      logo: (
        <Image src="Frame 8.svg" alt="The Tiny Hack" width={120} height={120} />
      ),
      description:
        "The Tiny Hack was a 10-hour hackathon that took place in 2023 and was intended for people who were keen to create and construct creative projects quickly. The event's main goal was to use technology to develop modest but significant solutions to real-world issues. In order to realise their ideas, participants worked closely with like-minded people from a variety of academic and professional backgrounds.",
      color: "#F3D055",
    },
    {
      id: 9,
      title: "CODEX CRYPTUM",
      logoScale: 2,
      textColor: "#fff",
      logo: (
        <Image
          src="codex-cryptum-logo.svg"
          alt="Insipher"
          width={120}
          height={120}
        />
      ),
      description:
        "Codex Cryptum began as a specialised workshop in September 2022 with the goal of expanding participants' knowledge of cryptography and cybersecurity. Attendees can delve into advanced topics and gain practical insights through the event's hands-on sessions and interactions with industry experts. Participants can broaden their knowledge, hone their skills, and have insightful conversations with colleagues and subject matter experts through this workshop.",
      color: "#D96700",
    },
  ];
  return (
    <div
      className="bg-gradient-to-br from-black via-gray-950 to-black w-full text-white font-doppio overflow-y-scroll p-20 relative"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#6b7280 #1f2937",
      }}
    >
      <style jsx global>{`
        .bg-gradient-to-br::-webkit-scrollbar {
          width: 14px;
        }
        .bg-gradient-to-br::-webkit-scrollbar-track {
          background: #1f2937;
        }
        .bg-gradient-to-br::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 7px;
          border: 2px solid #1f2937;
        }
        .bg-gradient-to-br::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-0 w-[600px] h-[600px] bg-emerald-500/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 right-0 w-[550px] h-[550px] bg-cyan-500/30 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-20 left-1/4 w-[500px] h-[500px] bg-purple-500/25 rounded-full blur-[120px] animate-pulse [animation-delay:0.5s]" />
        <div className="absolute top-2/3 left-1/2 w-[400px] h-[400px] bg-orange-500/20 rounded-full blur-[100px] animate-pulse [animation-delay:1.5s]" />
        {/* grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <header className="px-8 pt-8 flex items-center justify-center mb-16 relative z-10">
        <h2
          className="text-center text-6xl xl:text-7xl 2xl:text-8xl font-black  tracking-wide"
          style={{
            WebkitTextStrokeWidth: "3px",
            WebkitTextStrokeColor: "#FFF",
            color: "#000",
            fontFamily: "var(--font-poppins), sans-serif",
            fontWeight: 900,
            lineHeight: "normal",
            padding: "16px 32px",
            borderRadius: "8px",
            display: "inline-block",
          }}
        >
          Events & Projects
        </h2>
      </header>

      <main
        className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-8 pt-6 pb-12 relative z-10"
        style={{ fontFamily: "var(--font-poppins), sans-serif" }}
      >
        <div className="grid grid-cols-3 gap-x-12 gap-y-20 xl:gap-x-16 xl:gap-y-24 2xl:gap-x-20 2xl:gap-y-28 px-4">
          {eventsData.map((event) => (
            <button
              key={event.id}
              type="button"
              className="relative cursor-pointer group transition-all duration-300 border-none bg-transparent p-0 w-full text-left"
              onClick={() => setSelectedEvent(event)}
              style={{
                perspective: "1000px",
                fontFamily: "var(--font-poppins), sans-serif",
              }}
            >
              <div
                className="absolute inset-0 z-0"
                style={{
                  filter: `drop-shadow(0 28px 60px 40)`,
                }}
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 300 180"
                  className="h-auto w-full"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M 25 0 L 180 0 C 195 0 200 35 220 35 L 275 35 C 288.8 35 300 46.2 300 60 L 300 155 C 300 168.8 288.8 180 275 180 L 25 180 C 11.2 180 0 168.8 0 155 L 0 25 C 0 11.2 11.2 0 25 0 Z"
                    fill={event.color}
                    opacity={0.7}
                  />
                </svg>
              </div>

              {/* Logo with 3D hover animation */}
              <div className="relative w-full h-24 xl:h-32 2xl:h-40 -mb-4 flex items-center justify-center z-[5]">
                <div
                  className={`drop-shadow-2xl transition-all duration-500 ease-out w-[90px] xl:w-[110px] 2xl:w-[130px] group-hover:-translate-y-12`}
                  style={{
                    transform: `translate(0,0) rotate(-2deg) scale(${
                      event.logoScale || 1
                    })`,
                  }}
                >
                  {event.logo}
                </div>
              </div>

              <div
                className="absolute bottom-[64px] xl:bottom-[80px] 2xl:bottom-[96px] left-4 xl:left-6 2xl:left-8 w-24 xl:w-32 2xl:w-40 h-6 xl:h-8 2xl:h-10 rounded-t-lg z-[15]"
                style={{
                  backgroundColor: event.color,
                }}
              />
              {/* Folder with 3D tilt animation */}
              <div
                className="relative z-[15] origin-bottom transition-transform duration-500 ease-out [transform:translateY(0)_rotateX(0deg)_translateZ(0)] group-hover:[transform:translateY(-2px)_rotateX(-16deg)_translateZ(14px)]"
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: "50% 100%",
                }}
              >
                <svg
                  viewBox="0 0 300 180"
                  className="w-full h-auto drop-shadow-[0_16px_34px_rgba(0,0,0,0.35)]"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ transformOrigin: "50% 0%" }}
                >
                  <title>Folder</title>
                  <path
                    d="M 25 0 L 180 0 C 195 0 200 35 220 35 L 275 35 C 288.8 35 300 46.2 300 60 L 300 155 C 300 168.8 288.8 180 275 180 L 25 180 C 11.2 180 0 168.8 0 155 L 0 25 C 0 11.2 11.2 0 25 0 Z"
                    fill={event.color}
                  />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <h3
                    className="font-bold text-xl xl:text-2xl 2xl:text-3xl text-center px-4 drop-shadow-lg"
                    style={{
                      color: event.textColor || "#FFFFFF",
                      fontFamily: "var(--font-poppins), sans-serif",
                    }}
                  >
                    {event.title}
                  </h3>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Modal Overlay */}
        {selectedEvent && (
          <FolderDesignBig
            title={selectedEvent.title}
            description={selectedEvent.description}
            color={selectedEvent.color}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </main>
    </div>
  );
};

export default Events;
