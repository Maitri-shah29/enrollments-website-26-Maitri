"use client";

import Image from "next/image";
import type { ChangeEvent, KeyboardEvent } from "react";

interface HomePageProps {
  query: string;
  onQueryChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onQueryKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onNavigateKeyword?: (keyword: string) => void;
}

const topEventNames = ["Cryptic Hunt", "Reverse Coding", "Exam Cooker"];
const bottomEventNames = ["Forktober", "Unipool", "Code 2 Create"];

const domainLinks = [
  { label: "Design", keyword: "design", variant: "outline" as const },
  { label: "CC", keyword: "cc", variant: "solid" as const },
  { label: "Research", keyword: "research", variant: "solid" as const },
  { label: "Tech", keyword: "tech", variant: "outline" as const },
  { label: "Management", keyword: "management", variant: "solid" as const },
];

const aboutMarqueeRows = Array.from({ length: 5 }, (_, index) => index);

const HomePage: React.FC<HomePageProps> = ({
  query,
  onQueryChange,
  onQueryKeyDown,
  onNavigateKeyword,
}) => {
  const handleKeyword = (keyword: string) => () => onNavigateKeyword?.(keyword);

  return (
    <div className="relative min-h-full w-full bg-[#080808] text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),rgba(0,0,0,0.25)_38%,rgba(0,0,0,0.85)_70%)]" />
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/acm-mascot.png"
          alt="ACM mascot illustration"
          fill
          priority
          className="object-contain object-left opacity-25"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-[1500px] flex-col gap-10 px-4 py-8 sm:px-6 lg:px-10">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-4xl font-extrabold uppercase tracking-[0.24em] text-white whitespace-nowrap [text-shadow:_0px_3px_2px_rgb(131_131_132_/_1.00)]">
            ACM-VIT
          </h1>
          <div className="flex w-full max-w-2xl items-center rounded-2xl bg-white/90 px-6 py-3 text-neutral-800 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur">
            <input
              className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-neutral-400"
              placeholder="Search"
              value={query}
              onChange={onQueryChange}
              onKeyDown={onQueryKeyDown}
            />
          </div>
        </div>

        <div className="grid gap-5 lg:auto-rows-[240px] lg:grid-cols-12">
          <button
            type="button"
            onClick={handleKeyword("acmvit.in")}
            className="relative col-span-12 overflow-hidden rounded-xl border border-white/10 bg-white/20 p-6 text-left shadow-[0_24px_60px_rgba(0,0,0,0.45)] transition hover:bg-white/24 hover:shadow-[0_28px_70px_rgba(0,0,0,0.55)] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808] lg:col-span-6 lg:col-start-1 lg:h-full"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-black/40" />
              <div
                className="absolute left-[-55%] top-1/2 flex w-[320%] -translate-y-1/2 select-none text-white/10 font-bold"
                style={{
                  transform: "rotate(65deg)",
                }}
              >
                <div className="flex flex-col">
                  {aboutMarqueeRows.map((row) => (
                    <span
                      key={row}
                      className="animate-about-drift whitespace-nowrap text-[84px] font-PolysansTrial font-black leading-[0.69] tracking-tight text-white/15 drop-shadow-[0_12px_26px_rgba(0,0,0,0.55)]"
                    >
                      acmacmacmacmacmacmacmacm
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative z-10 flex h-full flex-col justify-center">
              <h2
                className="text-6xl font-poppins"
                style={{
                  color: "transparent",
                  WebkitTextStroke: "2px white",
                  textShadow: "0 8px 24px rgba(0,0,0,0.45)",
                }}
              >
                About ACM
              </h2>
            </div>
          </button>

          <section className="relative col-span-12 flex h-full flex-col gap-6 rounded-xl border border-white/10 bg-white/14 p-6 shadow-[0_20px_48px_rgba(0,0,0,0.45)] lg:col-span-3 lg:col-start-7 lg:row-start-1">
            <div className="pointer-events-none absolute inset-0">
              <span className="absolute left-0 top-0 h-5 w-5 border-t-[7px] border-l-[7px] border-white" />
              <span className="absolute right-0 top-0 h-5 w-5 border-t-[7px] border-r-[7px] border-white" />
              <span className="absolute left-0 bottom-0 h-5 w-5 border-b-[7px] border-l-[7px] border-white" />
              <span className="absolute right-0 bottom-0 h-5 w-5 border-b-[7px] border-r-[7px] border-white" />
            </div>
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 text-center">
              <h3 className="text-5xl font-semibold text-white">Photos</h3>
            </div>
          </section>

          <button
            type="button"
            onClick={handleKeyword("events")}
            className="group relative col-span-12 flex h-full flex-col items-center justify-between gap-2 overflow-hidden rounded-xl border border-white/10 bg-white/14 px-2 py-2 text-center shadow-[0_20px_48px_rgba(0,0,0,0.45)] lg:col-span-3 lg:col-start-10 lg:row-span-2"
          >
            {/* Gradient overlay for normal and hover state */}
            <div className="pointer-events-none absolute inset-0 transition-all duration-300 bg-gradient-to-br from-white/30 via-white/7 to-black/40 opacity-50 group-hover:from-white/25 group-hover:via-white/5 group-hover:to-black/40 group-hover:opacity-100" />

            <div className="relative z-10 flex w-full flex-col font-bold gap-3 whitespace-nowrap text-2xl uppercase tracking-[0.1em] text-white/85">
              {topEventNames.map((label, index) => (
                <span
                  key={label}
                  className="inline-flex font-poppins"
                  style={{
                    animation: `eventsOscillate 6s ease-in-out ${index * 0.4}s infinite alternate`,
                  }}
                >
                  {[0, 1].map((repeat) => (
                    <span key={`${label}-${repeat}`} className="px-3">
                      {label === "Reverse Coding" ? (
                        <span
                          className="inline-block"
                          style={{
                            color: "transparent",
                            WebkitTextStroke: "1px white",
                            textShadow: "0 6px 16px rgba(0,0,0,0.5)",
                          }}
                        >
                          {label}
                        </span>
                      ) : (
                        label
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </div>
            <div>
              <h3
                className="text-5xl font-poppins"
                style={{
                  color: "transparent",
                  WebkitTextStroke: "2px white",
                  textShadow: "0 8px 24px rgba(0,0,0,0.45)",
                }}
              >
                Events and Projects
              </h3>
            </div>
            <div className="relative z-10 flex w-full flex-col font-bold gap-3 whitespace-nowrap text-2xl uppercase tracking-[0.1em] text-white/85">
              {bottomEventNames.map((label, index) => (
                <span
                  key={label}
                  className="inline-flex font-poppins"
                  style={{
                    animation: `eventsOscillate 6.5s ease-in-out ${index * 0.5}s infinite alternate-reverse`,
                  }}
                >
                  {[0, 1].map((repeat) => (
                    <span key={`${label}-${repeat}`} className="px-3">
                      {label === "Forktober" || label === "Code 2 Create" ? (
                        <span
                          className="inline-block"
                          style={{
                            color: "transparent",
                            WebkitTextStroke: "1px white",
                            textShadow: "0 6px 16px rgba(0,0,0,0.5)",
                          }}
                        >
                          {label}
                        </span>
                      ) : (
                        label
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </button>

          <section className="relative w-full col-span-12 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/16 text-sm text-white/70 shadow-[0_18px_40px_rgba(0,0,0,0.4)] lg:col-span-3 lg:col-start-1 lg:row-start-2">
            {/* Spotify Player Container with fixed height */}
            <div className="relative w-full h-[380px] overflow-hidden rounded-xl">
              <iframe
                data-testid="embed-iframe"
                title="Spotify Player"
                src="https://open.spotify.com/embed/playlist/0BhXhc13wRrxN8cMEUtUBr?si=eABr9RD8SuaeoAluxuWxQQ?utm_source=generator&theme=0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="absolute inset-0 w-full h-full rounded-xl"
              ></iframe>
            </div>

            {/* Optional gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
          </section>

          <section className="relative col-span-12 cursor-default flex h-full flex-col bg-gradient-to-br from-white/25 via-white/5 to-black/40 items-center justify-between rounded-xl border border-white/10 bg-white/16 px-2 py-2 text-center shadow-[0_18px_40px_rgba(0,0,0,0.4)] transition hover:bg-white/24 hover:shadow-[0_28px_70px_rgba(0,0,0,0.55)] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808] lg:col-span-6 lg:col-start-4 lg:row-start-2">
            <div className="flex w-full items-center justify-between gap-6">
              {domainLinks.slice(0, 2).map(({ label, keyword, variant }) => (
                <button
                  key={label}
                  type="button"
                  onClick={handleKeyword(keyword)}
                  className="font-poppins text-2xl font-semibold tracking-[0.05em] transition-transform duration-150 hover:-translate-y-1"
                  style={
                    variant === "outline"
                      ? {
                          color: "transparent",
                          WebkitTextStroke: "1px white",
                          textShadow: "0 4px 14px rgba(0,0,0,0.45)",
                        }
                      : {
                          color: "white",
                          textShadow: "0 4px 14px rgba(0,0,0,0.45)",
                        }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="text-6xl font-poppins"
              style={{
                color: "transparent",
                WebkitTextStroke: "2px white",
                textShadow: "0 8px 24px rgba(0,0,0,0.45)",
              }}
              onClick={handleKeyword("domains")}
            >
              Domains
            </button>
            <div className="flex w-full flex-col gap-6">
              <div className="flex w-full items-center justify-between gap-6">
                {domainLinks.slice(2).map(({ label, keyword, variant }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={handleKeyword(keyword)}
                    className="font-poppins text-2xl font-semibold tracking-[0.05em] transition-transform duration-150 hover:-translate-y-1"
                    style={
                      variant === "outline"
                        ? {
                            color: "transparent",
                            WebkitTextStroke: "1px white",
                            textShadow: "0 4px 14px rgba(0,0,0,0.45)",
                          }
                        : {
                            color: "white",
                            textShadow: "0 4px 14px rgba(0,0,0,0.45)",
                          }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
      <style jsx>{`
        @keyframes eventsOscillate {
          0% {
            transform: translateX(-12%);
          }
          100% {
            transform: translateX(12%);
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
