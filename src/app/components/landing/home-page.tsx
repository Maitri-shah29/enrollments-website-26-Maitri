"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type KeyboardEvent,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import Gravity, { MatterBody } from "@/app/components/gravity";

interface HomePageProps {
  onNavigateKeyword?: (keyword: string) => void;
}

const topEventNames = ["Cryptic Hunt", "Reverse Coding", "Exam Cooker"];
const bottomEventNames = ["Forktober", "Unipool", "Code 2 Create"];

const stickerPhysics = {
  matterBodyOptions: {
    friction: 0.12,
    restitution: 0.4,
    density: 0.001,
    frictionAir: 0.016,
  },
};

const stickerTextBase: React.CSSProperties = {
  WebkitFontSmoothing: "antialiased",
  textRendering: "optimizeLegibility",
  WebkitTextStroke: "3px #ffffff",
  paintOrder: "stroke fill",
  filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.28))",
};

const aboutMarqueeRows = Array.from({ length: 5 }, (_, index) => index);

const value = 0;
const phrases = ["Because Technology Matters."];

const PhotoPanel: React.FC = memo(() => {
  const photosRef = useRef<string[]>([]);
  const photoElementRef = useRef<HTMLImageElement | null>(null);
  const [hasPhotos, setHasPhotos] = useState(false);
  const [initialPhoto, setInitialPhoto] = useState<string | null>(null);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const response = await fetch("/api/photos");
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const fetchedPhotos = Array.isArray(data.photos) ? data.photos : [];
        photosRef.current = fetchedPhotos;
        setHasPhotos(fetchedPhotos.length > 0);
        setInitialPhoto(fetchedPhotos[0] ?? null);
      } catch (error) {
        console.error("Failed to fetch photos", error);
      }
    };

    void loadPhotos();
  }, []);

  useEffect(() => {
    if (!hasPhotos || photosRef.current.length === 0) return;
    if (photoElementRef.current && photosRef.current[0]) {
      photoElementRef.current.src = photosRef.current[0];
    }

    if (photosRef.current.length <= 1) return;

    let index = 0;
    const timer = setInterval(() => {
      index = (index + 1) % photosRef.current.length;
      const el = photoElementRef.current;
      if (el) {
        el.src = photosRef.current[index];
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [hasPhotos]);

  return (
    <section className="relative col-span-12 flex h-full min-h-[20vh] sm:min-h-[22vh] lg:min-h-[24vh] xl:min-h-[26vh] overflow-hidden rounded-2xl border border-white/10 bg-white/14 shadow-[0_16px_36px_rgba(0,0,0,0.45)] lg:col-span-3 lg:col-start-7 lg:row-start-1">
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-0 top-0 h-5 w-5 border-t-[7px] border-l-[7px] border-white" />
        <span className="absolute right-0 top-0 h-5 w-5 border-t-[7px] border-r-[7px] border-white" />
        <span className="absolute left-0 bottom-0 h-5 w-5 border-b-[7px] border-l-[7px] border-white" />
        <span className="absolute right-0 bottom-0 h-5 w-5 border-b-[7px] border-r-[7px] border-white" />
      </div>
      <div className="relative z-10 flex h-full w-full">
        {!hasPhotos ? (
          <div className="flex h-full w-full items-center justify-center bg-black/30 text-lg text-white/60">
            Loading :/
          </div>
        ) : (
          <img
            ref={photoElementRef}
            src={initialPhoto ?? ""}
            alt="ACM club activities"
            className="h-full w-full object-cover"
            loading="lazy"
            draggable={false}
          />
        )}
      </div>
    </section>
  );
});
PhotoPanel.displayName = "PhotoPanel";

const HomePage: React.FC<HomePageProps> = ({ onNavigateKeyword }) => {
  const handleKeyword = (keyword: string) => () => onNavigateKeyword?.(keyword);

  return (
    <div className="flex justify-center items-center h-full w-full text-white select-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),rgba(0,0,0,0.25)_38%,rgba(0,0,0,0.85)_70%)]" />
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

      <div className="relative mx-auto flex h-full w-full max-w-[90vw] md:max-w-[92vw] xl:max-w-[94vw] 2xl:max-w-[96vw] flex-col gap-8 px-4 pt-8 sm:px-6 lg:px-10 2xl:px-12">
        <div className="grid w-full gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
          <div
            onClick={handleKeyword("acmvit.in")}
            className="relative h-26 w-44 justify-self-start sm:h-20 sm:w-56"
          >
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

          <div className="w-full h-full flex items-center justify-center text-center text-3xl sm:text-4xl 2xl:text-[2.6rem] font-poppins">
            {phrases[value]}
          </div>
          <div
            className="hidden h-16 w-44 justify-self-end sm:block sm:h-20 sm:w-56"
            aria-hidden="true"
          />
        </div>

        <div className="grid gap-4 2xl:gap-5 auto-rows-[22vh] sm:auto-rows-[24vh] lg:auto-rows-[26vh] xl:auto-rows-[28vh] 2xl:auto-rows-[30vh] grid-cols-12 h-full">
          <div className="col-span-6 relative" onClick={handleKeyword("about")}>
            <div className="w-full h-full bg-[#292625] rounded-xl flex items-center text-5xl font-poppins pl-10">
              <h1>About ACM</h1>
              <Image
                src="/images/addons/Group 1000007435.png"
                width={400}
                height={400}
                alt="acmacmacm"
                draggable={false}
                className="absolute right-0 z-0 h-full"
              />
            </div>
            <Image
              src="/images/addons/Phone 2.svg"
              width={1500}
              height={1500}
              alt="ACM VIT Website Preview"
              className="absolute w-[130%] h-[130%] bottom-0 -right-50"
              draggable={false}
            />
          </div>

          <PhotoPanel />

          <div
            className="col-span-3 row-span-2 bg-[#292625] rounded-2xl relative overflow-hidden min-h-[38vh] lg:min-h-[40vh] xl:min-h-[44vh] 2xl:min-h-[48vh]"
            onClick={handleKeyword("events")}
          >
            <Image
              src="/images/addons/Group 2087325586.svg"
              alt="events"
              width={500}
              draggable={false}
              height={500}
            ></Image>
            <h1 className="w-full text-center text-3xl lg:text-[2.2rem] xl:text-[2rem] 2xl:text-[2.1rem] font-poppins bottom-6 absolute px-4 leading-tight">
              Events and Projects
            </h1>
          </div>

          <section
            className="grid w-full h-full relative row-span-1 lg:col-span-3 lg:col-start-1 lg:row-start-2 overflow-hidden rounded-xl"
            style={{ gridTemplateRows: "1fr 1fr" }}
          >
            <div className="group max-h-25 w-full overflow-hidden rounded-xl relative bg-[#252525]">
              <a
                href="https://open.spotify.com/playlist/0BhXhc13wRrxN8cMEUtUBr?si=eABr9RD8SuaeoAluxuWxQQ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open ACM playlist on Spotify (opens in new tab)"
                className="relative w-full h-full flex items-center justify-center rounded-xl"
              >
                <Image
                  src="/spotify.svg"
                  alt="Spotify"
                  fill
                  draggable={false}
                  sizes="(min-width: 1024px) 25vw, 100vw"
                  className="object-fit rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/60 rounded-xl" />
                <span className="absolute text-white text-lg font-medium opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  ACM-VIT Blend of '26
                </span>
              </a>
            </div>

            <div className="row-start-2 absolute row-end-3 min-h-full w-full gap-4 flex flex-col items-center justify-center rounded-2xl bg-[#292625] px-4 py-2">
              <h1 className="font-poppins lg:text-md xl:text-2xl 2xl:text-2xl text-center tracking-wider select-none">
                Games
              </h1>

              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 select-none">
                {[
                  {
                    key: "snake",
                    src: "/images/addons/snake-icon.svg",
                    label: "Snake",
                  },
                  {
                    key: "krunker.io",
                    src: "/images/krunker-logo.png",
                    label: "Krunker",
                  },
                  {
                    key: "classic.minecraft.net",
                    src: "/images/minecraft-logo.svg",
                    label: "Minecraft Classic",
                  },
                  {
                    key: "404",
                    src: "/images/404game-logo.png",
                    label: "Break Bricks",
                  },
                  {
                    key: "skribbl.io",
                    src: "/images/skribbl-logo.svg",
                    label: "Skribbl.io",
                  },
                ].map(({ key, src, label }) => (
                  <div key={key} className="relative group">
                    <Image
                      onClick={handleKeyword(key)}
                      src={src}
                      alt={label}
                      width={100}
                      height={100}
                      draggable={false}
                      className="object-contain w-10 aspect-square rounded-md hover:cursor-pointer hover:scale-105 transition-all"
                    />

                    <span
                      className="
        absolute -top-8 left-1/2 -translate-x-1/2
        whitespace-nowrap
        rounded-md bg-black/60 px-2 py-1 text-xs text-white
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none z-100
      "
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <div
            onClick={handleKeyword("domains")}
            className="relative col-span-6 row-span-1 overflow-hidden rounded-3xl bg-[#292625] font-poppins shadow-[0_14px_32px_rgba(0,0,0,0.32)]"
          >
            <Gravity
              className="absolute inset-0 z-0 overflow-visible pointer-events-auto"
              gravity={{ x: 0, y: 1 }}
              addTopWall={true}
              grabCursor={true}
            >
              <MatterBody
                x="28%"
                y="10%"
                angle={-10}
                {...stickerPhysics}
                // onClick={handleKeyword("tech")}
              >
                <div
                  className="select-none text-[34px] font-black leading-[0.95] tracking-tight text-[#ff9cd9] hover:shadow-[0_6px_12px_#FFFFFF]"
                  style={stickerTextBase}
                >
                  Tech
                </div>
              </MatterBody>

              <MatterBody
                x="42%"
                y="5%"
                angle={-6}
                {...stickerPhysics}
                // onClick={handleKeyword("design")}
              >
                <div
                  className="select-none text-[34px] font-black leading-[0.95] tracking-tight text-[#ff8a1f]"
                  style={stickerTextBase}
                >
                  Design
                </div>
              </MatterBody>

              <MatterBody
                x="32%"
                y="15%"
                angle={-4}
                {...stickerPhysics}
                // onClick={handleKeyword("management")}
              >
                <div
                  className="select-none text-[34px] font-black leading-[0.95] tracking-tight text-[#3aa7ff]"
                  style={stickerTextBase}
                >
                  Management
                </div>
              </MatterBody>

              <MatterBody
                x="64%"
                y="10%"
                angle={8}
                {...stickerPhysics}
                // onClick={handleKeyword("research")}
              >
                <div
                  className="select-none text-[30px] font-black leading-none tracking-tight text-[#7751ff] drop-shadow-[0_6px_12px_rgba(0,0,0,0.3)]"
                  style={stickerTextBase}
                >
                  Research
                </div>
              </MatterBody>

              <MatterBody
                x="74%"
                y="5%"
                angle={4}
                {...stickerPhysics}
                // onClick={handleKeyword("cc")}
              >
                <div
                  className="select-none text-[34px] font-black leading-none tracking-tight text-[#4f7d1a]"
                  style={stickerTextBase}
                >
                  CC
                </div>
              </MatterBody>
            </Gravity>

            <div className="pointer-events-none absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="pointer-events-auto cursor-pointer text-[40px] font-black leading-tight text-white drop-shadow-[0_14px_28px_rgba(0,0,0,0.4)] sm:text-[48px] lg:text-[50px]">
                Domains
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
