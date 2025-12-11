"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useState,
} from "react";

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleKeyword = (keyword: string) => () => onNavigateKeyword?.(keyword);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const response = await fetch("/api/photos");
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setPhotos(Array.isArray(data.photos) ? data.photos : []);
        setCurrentPhotoIndex(0);
      } catch (error) {
        console.error("Failed to fetch photos", error);
      }
    };

    void loadPhotos();
  }, []);

  useEffect(() => {
    if (photos.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [photos]);

  return (
    <div className="flex justify-center items-center min-h-full w-full bg-[#080808] text-white select-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),rgba(0,0,0,0.25)_38%,rgba(0,0,0,0.85)_70%)]" />
      <div className="pointer-events-none absolute inset-0 flex h-full w-full">
        <Image
          src="/images/acm-mascot.png"
          alt="ACM mascot illustration"
          fill
          priority
          draggable={false}
          className="object-contain object-left opacity-25 select-none"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-[1500px] flex-col gap-10 px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid w-full gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-6">
          <div className="relative h-26 w-44 justify-self-start sm:h-20 sm:w-56">
            <Image
              src="/images/acmlogo.svg"
              alt="ACM-VIT logo"
              fill
              priority
              draggable={false}
              sizes="(min-width: 640px) 14rem, 11rem"
              className="object-contain select-none"
            />
          </div>
          <div className="flex w-full min-w-60 max-w-2xl items-center justify-self-center rounded-2xl bg-white/90 px-6 py-3 text-neutral-800 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur">
            <input
              className="w-full text-lg font-medium outline-none placeholder:text-neutral-400 select-text"
              placeholder="Search"
              value={query}
              onChange={onQueryChange}
              onKeyDown={onQueryKeyDown}
            />
            <Search className="text-[#525252] p-0.5" />
          </div>
          <div
            className="hidden h-16 w-44 justify-self-end sm:block sm:h-20 sm:w-56"
            aria-hidden="true"
          />
        </div>

        <div className="grid gap-5 lg:auto-rows-[280px] grid-cols-12 h-full">
          <div
            className="col-span-6 relative"
            onClick={handleKeyword("acmvit.in")}
          >
            <div className="w-full h-full bg-[#292625] rounded-xl flex items-center text-5xl font-poppins pl-10">
              <h1>About acm</h1>
              <Image
                src="/images/addons/Group 1000007435.png"
                width={400}
                height={400}
                alt="acmacmacm"
                className="absolute right-0"
              />
            </div>
            <Image
              src="/images/addons/Phone 2.svg"
              width={1500}
              height={1500}
              alt="ACM VIT Website Preview"
              className="absolute w-[130%] h-[130%] bottom-0 -right-50"
            />
          </div>

          <section className="relative col-span-12 flex h-full overflow-hidden rounded-xl border border-white/10 bg-white/14 shadow-[0_20px_48px_rgba(0,0,0,0.45)] lg:col-span-3 lg:col-start-7 lg:row-start-1">
            <div className="pointer-events-none absolute inset-0">
              <span className="absolute left-0 top-0 h-5 w-5 border-t-[7px] border-l-[7px] border-white" />
              <span className="absolute right-0 top-0 h-5 w-5 border-t-[7px] border-r-[7px] border-white" />
              <span className="absolute left-0 bottom-0 h-5 w-5 border-b-[7px] border-l-[7px] border-white" />
              <span className="absolute right-0 bottom-0 h-5 w-5 border-b-[7px] border-r-[7px] border-white" />
            </div>
            <div className="relative z-10 flex h-full w-full">
              {photos.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center bg-black/30 text-lg text-white/60">
                  No photos :/
                </div>
              ) : (
                <img
                  src={photos[currentPhotoIndex]}
                  alt="ACM club activities"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
          </section>

          <div
            className="col-span-3 row-span-2 bg-[#292625] rounded-xl relative"
            onClick={handleKeyword("events")}
          >
            <Image
              src="/images/addons/Group 2087325586.svg"
              alt="events"
              width={500}
              height={500}
            ></Image>
            <h1 className="text-center text-4xl font-poppins bottom-10 absolute">
              Events and Projects
            </h1>
          </div>

          <section className="flex w-full h-full flex-col gap-2 lg:col-span-3 lg:col-start-1 lg:row-start-2">
            <div className="relative h-full w-full items-center justify-center  col-span-12 flex flex-col overflow-hidden rounded-xl bg-[#292625]">
              <iframe
                data-testid="embed-iframe"
                title="Spotify Player"
                src="https://open.spotify.com/embed/playlist/0BhXhc13wRrxN8cMEUtUBr?si=eABr9RD8SuaeoAluxuWxQQ?utm_source=generator&theme=0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="absolute inset-0 w-full h-full rounded-xl"
              ></iframe>
            </div>
            <div className="relative h-30 w-full flex flex-col items-center justify-center rounded-xl bg-[#292625]">
              {/* <h1
                className="font-poppins text-2xl text-center tracking-wider select-none"
                style={{
                  color: "transparent",
                  WebkitTextStroke: "1px white",
                  textShadow: "0 8px 24px rgba(0,0,0,0.45)",
                }}
              >
                Games
              </h1> */}

              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 select-none">
                <Image
                  onClick={handleKeyword("pintoorun")}
                  src="/images/addons/pintoorun-icon.svg"
                  alt="Pintoo Run"
                  width={100}
                  height={100}
                  draggable={false}
                  className="object-contain w-8 aspect-square rounded-md hover:cursor-pointer hover:scale-105 transition-all select-none"
                />
                <Image
                  onClick={handleKeyword("snake")}
                  src="/images/addons/snake-icon.svg"
                  alt="Snake Game"
                  width={100}
                  height={100}
                  draggable={false}
                  className="object-contain w-8 aspect-square rounded-md hover:cursor-pointer hover:scale-105 transition-all select-none"
                />
                <Image
                  onClick={handleKeyword("krunker.io")}
                  src="/images/krunker-logo.png"
                  alt="Krunker"
                  width={100}
                  height={100}
                  draggable={false}
                  className="object-contain w-8 aspect-square rounded-md hover:cursor-pointer hover:scale-105 transition-all select-none"
                />
                <Image
                  onClick={handleKeyword("classic.minecraft.net")}
                  src="/images/minecraft-logo.svg"
                  alt="Minecraft"
                  width={100}
                  height={100}
                  draggable={false}
                  className="object-contain p-0.5 w-8 aspect-square rounded-md hover:cursor-pointer hover:scale-105 transition-all select-none"
                />

                <Image
                  onClick={handleKeyword("404")}
                  src="/images/404game-logo.png"
                  alt="Games Placeholder"
                  width={100}
                  height={100}
                  className="object-contain p-0.5 w-10 aspect-square rounded-md hover:cursor-pointer hover:scale-105 transition-all"
                />

                <Image
                  onClick={handleKeyword("skribbl.io")}
                  src="/images/skribbl-logo.svg"
                  alt="Games Placeholder"
                  width={100}
                  height={100}
                  className="object-contain p-0.5 w-10 aspect-square rounded-md hover:cursor-pointer hover:scale-105 transition-all"
                />
              </div>
            </div>

            {/* <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" /> */}
          </section>

          <div
            onClick={handleKeyword("domains")}
            className="relative col-span-6 bg-[#292625] rounded-xl text-5xl flex justify-center items-center font-poppins"
          >
            Domains
            <Image
              src="/images/addons/Group 2087325587.svg"
              alt="hhhh"
              width={270}
              height={270}
              className="absolute -left-2 -bottom-4"
            ></Image>
            <Image
              src="/images/addons/Group 2087325588.svg"
              alt="hhhh"
              width={200}
              height={200}
              className="absolute -right-3 -top-5"
            ></Image>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
