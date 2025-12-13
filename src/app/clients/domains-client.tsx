"use client";

import Image from "next/image";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Domain = {
  slug: string;
  title: string;
  summary: string;
  accent: string;
  folder: string;
  text: string;
  image: string;
  background: string;
};

const domains: Domain[] = [
  {
    slug: "design",
    title: "Design",
    summary:
      "Every ACM-VIT initiative gets its glow-up because of the Design Domain. We’re the creative ones who make everything presentable. Through UI/UX, motion graphics, video edits and 3D modelling, we craft the visuals that give the chapter its entire vibe.",
    accent: "#8C3428",
    folder: "#F55F4B",
    text: "#ffffff",
    image: "/images/domains/design.webp",
    background: "url('/images/domains/design-bg.png')",
  },
  {
    slug: "cc",
    title: "Competitive Coding",
    summary:
      "The Competitive Coding Domain is our way of solving challenges through contests, hacks and of course, leetcode. We might not agree on the language but we surely agree that passing a test case is pure happiness.",
    accent: "#7E9328",
    folder: "#BBD842",
    text: "#292625",
    image: "/images/domains/cc.svg",
    background: "url('/images/domains/cc-bg.png')",
  },
  {
    slug: "management",
    title: "Management",
    summary:
      "ACM-VIT’s Management Domain is basically the squad that makes sure everything actually happens. We make proper plans and make sure things don’t fall apart five minutes before the event. Organisation, communication, strategy and execution - that’s what defines us.",
    accent: "#0E3A60",
    folder: "#46A8FF",
    text: "#ffffff",
    image: "/images/domains/management.webp",
    background: "url('/images/domains/management-bg.png')",
  },
  {
    slug: "research",
    title: "Research",
    summary:
      "The Research Domain is the place to bring out your inner scientist. From diving deep into our interests to exploring new fields, we work on projects that turn research into real, practical stuff. Be it fields like AI/ML, IoT, cybersecurity and quantum computing - we got it all!",
    accent: "#3C2C73",
    folder: "#A98FFF",
    text: "#ffffff",
    image: "/images/domains/research.webp",
    background: "url('/images/domains/research-bg.png')",
  },
  {
    slug: "tech",
    title: "Tech",
    summary:
      "ACM-VIT’s Tech Domain is where we work on real projects related to web, app, gamedev, FOSS and DevOps. We learn, build, break things, fix them again, and somehow grow together through it all.",
    accent: "#7B336E",
    folder: "#FF6CD9",
    text: "#ffffff",
    image: "/images/domains/tech.webp",
    background: "url('/images/domains/tech-bg.png')",
  },
];

const Domains = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null,
  );
  const [autoHover, setAutoHover] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const active = useMemo(() => domains[activeIndex], [activeIndex]);
  const backgroundImage = active.background;

  const backFlapColor = active.accent;
  const frontFlapColor = active.folder;

  const handleNavigate = useCallback((url: string) => {
    window.parent.postMessage({ type: "NAVIGATE_TO", url }, "*");
  }, []);

  const goNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection("left");
    setTimeout(() => {
      setSlideDirection(null);
      setIsAnimating(false);
    }, 800);
    setActiveIndex((prev) => (prev + 1) % domains.length);
  }, [isAnimating]);

  const goPrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection("right");
    setTimeout(() => {
      setSlideDirection(null);
      setIsAnimating(false);
    }, 800);
    setActiveIndex((prev) => (prev - 1 + domains.length) % domains.length);
  }, [isAnimating]);

  const handleNavigateKey = useCallback(
    (event: React.KeyboardEvent<HTMLElement>, slug: string) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleNavigate(slug);
      }
    },
    [handleNavigate],
  );

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [goNext, goPrev]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: activeIndex is intentionally used as a trigger to re-run the animation effect
  useEffect(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (hoverStartTimeoutRef.current) {
      clearTimeout(hoverStartTimeoutRef.current);
    }
    setAutoHover(false);
    hoverStartTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAutoHover(true);
          hoverTimeoutRef.current = setTimeout(() => setAutoHover(false), 1100);
        });
      });
    }, 180);
  }, [activeIndex]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hoverStartTimeoutRef.current) {
        clearTimeout(hoverStartTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black text-white font-doppio">
      <style jsx>{`
        @keyframes slide-left {
          0% {
            opacity: 0;
            transform: translateX(60px) scale(0.95);
          }
          60% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes slide-right {
          0% {
            opacity: 0;
            transform: translateX(-60px) scale(0.95);
          }
          60% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .animate-slide-left {
          animation: slide-left 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-slide-right {
          animation: slide-right 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        :global([data-auto-hover="true"] .auto-hover-image) {
          transform: translate(-35%, -60%) rotate(-6deg) scale(1.05) !important;
        }
        :global([data-auto-hover="true"] .auto-hover-flap) {
          transform: translateY(-2px) rotateX(-16deg) translateZ(14px) !important;
        }
      `}</style>
      <div
        className="pointer-events-none absolute inset-0 opacity-90 transition-all duration-500 h-full"
        style={{
          backgroundImage,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />

      <div className="z-10 flex items-center xl:justify-center h-full flex-col px-6 py-6 md:px-10 lg:px-12 overflow-auto">
        <header className="mb-5 flex w-full items-center justify-center">
          <h2
            className="text-center text-5xl mt-5 font-poppins tracking-tight drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            style={{
              color: "transparent",
              WebkitTextStroke: "3px white",
              textShadow: "0 8px 24px rgba(0,0,0,0.45)",
            }}
          >
            Domains
          </h2>
        </header>

        <main className="relative w-full max-w-6xl">
          <button
            aria-label="Previous domain"
            type="button"
            className="absolute -left-3 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full shadow-2xl shadow-black/40 transition-transform duration-200 hover:scale-110 sm:-left-6 md:-left-8"
            style={{ backgroundColor: active.accent }}
            onClick={goPrev}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Previous domain"
            >
              <title>Previous domain</title>
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>

          <button
            aria-label="Next domain"
            type="button"
            className="absolute -right-3 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full shadow-2xl shadow-black/40 transition-transform duration-200 hover:scale-110 sm:-right-6 md:-right-8"
            style={{ backgroundColor: active.accent }}
            onClick={goNext}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Next domain"
            >
              <title>Next domain</title>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          <button
            type="button"
            className="group relative mx-auto flex max-w-5xl cursor-pointer flex-col items-center gap-6 overflow-visible px-4 pb-6 pt-4 sm:px-8 md:px-12"
            onClick={() => handleNavigate(active.slug)}
            onKeyDown={(event) => handleNavigateKey(event, active.slug)}
            data-auto-hover={autoHover ? "true" : "false"}
          >
            <div className="relative w-full max-w-4xl flex justify-center">
              <div
                className={`relative h-[460px] w-[420px] sm:w-[520px] transition-all duration-500 ease-out ${
                  slideDirection === "left"
                    ? "animate-slide-left"
                    : slideDirection === "right"
                      ? "animate-slide-right"
                      : ""
                }`}
                style={{ perspective: "1400px" }}
              >
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    filter: `drop-shadow(0 28px 60px ${active.accent}40)`,
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
                      fill={backFlapColor}
                    />
                  </svg>
                </div>

                <div
                  className="absolute left-1/2 top-24 z-10 h-52 w-72 -translate-x-1/2 overflow-hidden bg-white shadow-[0_18px_45px_rgba(0,0,0,0.55)] transform-gpu transition-transform duration-500 ease-out [transform:translate(-50%,-50%)_rotate(-2deg)_scale(1)] group-hover:[transform:translate(-35%,-60%)_rotate(-6deg)_scale(1.05)] auto-hover-image"
                  style={{ border: "6px solid white" }}
                >
                  <Image
                    src={active.image}
                    alt={active.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 240px, 320px"
                    priority
                  />
                </div>

                <div
                  className="absolute left-0 right-0 top-28 z-20 origin-bottom transform-gpu transition-transform duration-500 ease-out [transform:translateY(0)_rotateX(0deg)_translateZ(0)] group-hover:[transform:translateY(-2px)_rotateX(-16deg)_translateZ(14px)] auto-hover-flap"
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "50% 100%",
                  }}
                >
                  <svg
                    viewBox="0 0 300 180"
                    className="h-auto w-full drop-shadow-[0_16px_34px_rgba(0,0,0,0.35)]"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ transformOrigin: "50% 0%" }}
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M 25 0 L 180 0 C 195 0 200 35 220 35 L 275 35 C 288.8 35 300 46.2 300 60 L 300 155 C 300 168.8 288.8 180 275 180 L 25 180 C 11.2 180 0 168.8 0 155 L 0 25 C 0 11.2 11.2 0 25 0 Z"
                      fill={frontFlapColor}
                    />
                  </svg>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-end px-10 pb-16">
                    <h3
                      className="text-left text-3xl font-poppins md:text-4xl"
                      style={{ color: active.text }}
                    >
                      {active.title}
                    </h3>
                    <div
                      className="my-3 h-[2px] w-2/3 items-start"
                      style={{ backgroundColor: active.text }}
                    />
                    <p
                      className="max-w-xl text-base leading-6 text-left"
                      style={{ color: active.text }}
                    >
                      {active.summary}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </main>
      </div>
    </div>
  );
};

export default Domains;
