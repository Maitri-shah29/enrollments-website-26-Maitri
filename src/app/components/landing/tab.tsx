"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import Domains from "@/app/clients/domains-client";
import Events from "@/app/clients/events-client";
import PintooRun from "@/app/clients/PintooRun-client";
import ResearchClient from "@/app/clients/research-client";
import SnakeClient from "@/app/clients/snake-client";
import TechWebsite from "@/app/clients/tech-client";
import BrickGame404 from "../brick-game-404";
import ProfileButton from "../profile-button";
import RefreshButton from "../refresh-button";
import { useSessionContext } from "../session-provider"; // Adjust path as needed
import SignupPage from "../sign-up";
import HomePage from "./home-page";

const ROTATING_WEBSITES = [
  "ocs.acmvit.in",
  "fast.com",
  "acmvit.in",
  "krunker.io",
  "slither.io",
  "comick.live",
  "skrbbl.io",
  "wikipedia.org",
  "classic.minecraft.net",
  "chess.com",
];

const IFRAME_WHITELIST = new Set([
  // 🌐 Core / Existing
  "os.acmvit.in",
  "localhost.acmvit.in",
  "rcpc.acmvit.in",
  "codeplusplus.acmvit.in",
  "acmvit.in",
  "fast.com",
  "icpc.global",
  "comick.live",

  // 🎮 Games & Game Sites
  "agar.io",
  "slither.io",
  "krunker.io",
  "diep.io",
  "splix.io",
  "paper.io",
  "skribbl.io",
  "1v1.lol",
  "ev.io",
  "shellshock.io",
  "bonk.io",
  "littlealchemy2.com",
  "zombs.io",
  "surviv.io",
  "classic.minecraft.net",
  "2048game.com",
  "chess.com",
  "lichess.org",
  "poki.com",
  "crazygames.com",
  "miniclip.com",
  "itch.io",
  "cardgames.io",
  "worldsbiggestpacman.com",
  "snowrider3d.com",
  "slopegame.online",
  "tetr.io",
  "wanderers.io",
  "wormate.io",
  "hole.io",
  "skibiditoilet.io",

  // 📚 Educational / Math / Science
  "desmos.com",
  "geogebra.org",
  "symbolab.com",
  "mathplayground.com",
  "mathsisfun.com",
  "openstax.org",
  "khanacademy.org",
  "brilliant.org",
  "quizizz.com",
  "quizlet.com",
  "kahoot.it",
  "h5p.org",
  "phet.colorado.edu",
  "edpuzzle.com",
  "ixl.com",
  "codecademy.com",
  "projecteuler.net",
  "scratch.mit.edu",

  // 💻 Coding / Developer Tools
  "codepen.io",
  "jsfiddle.net",
  "codesandbox.io",
  "replit.com",
  "stackblitz.com",
  "glitch.me",
  "threejs.org",
  "p5js.org",
  "openprocessing.org",
  "codewars.com",
  "leetcode.com",
  "geeksforgeeks.org",
  "uiverse.io",
  "regex101.com",
  "jwt.io",
  "jsonlint.com",
  "httpbin.org",
  "reqres.in",
  "mocky.io",
  "codebeautify.org",
  "pastebin.com",
  "stackedit.io",
  "hackmd.io",
  "markdownlivepreview.com",
  "mdn.dev",
  "w3schools.com",
  "jsdelivr.net",
  "unpkg.com",
  "cdnjs.com",
  "raw.githack.com",
  "pythonanywhere.com",
  "vercel.app",
  "netlify.app",
  "herokuapp.com",
  "repl.co",
  "surge.sh",
  "firebaseapp.com",
  "supabase.com",
  "render.com",

  // 🎨 Design / Drawing / Whiteboards
  "tldraw.com",
  "excalidraw.com",
  "miro.com",
  "figma.com",
  "canva.com",
  "draw.io",
  "diagrams.net",
  "vectr.com",
  "pixlr.com",
  "photopea.com",
  "sketch.io",
  "jspaint.app",
  "flipanim.com",
  "autodraw.com",
  "pixilart.com",
  "jamboard.google.com",

  // 🌍 Maps / Geo / Visualization
  "openstreetmap.org",
  "geojson.io",
  "earth.google.com",
  "maps.google.com",
  "maptiler.com",
  "bing.com/maps",
  "wego.here.com",
  "leafletjs.com",
  "mapbox.com",
  "nasa.gov",
  "stellarium-web.org",
  "peakfinder.org",

  // 📁 Google Embeds (Must Use /embed or /preview)
  "docs.google.com/forms",
  "docs.google.com/presentation",
  "docs.google.com/spreadsheets",
  "drive.google.com/file",
  "calendar.google.com/calendar",
  "youtube.com/embed",
  "player.vimeo.com",

  // 🎵 Audio / Media Embeds
  "open.spotify.com/embed",
  "soundcloud.com",
  "bandcamp.com",
  "radio.garden",
  "tunein.com",
  "anchor.fm",

  // ✅ Productivity / Collaboration
  "notion.so",
  "airtable.com",
  "trello.com",
  "typeform.com",
  "forms.gle",

  // 📖 Info / Knowledge / Open Data
  "wikipedia.org",
  "wikimedia.org",
  "archive.org",
  "openlibrary.org",
  "britannica.com",
  "worldtimeapi.org",
  "timeanddate.com",
  "weather.com",
  "ecosia.org",
  "duckduckgo.com",
  "startpage.com",

  // ⚙️ Utilities / File / Media Tools
  "remove.bg",
  "ilovepdf.com",
  "smallpdf.com",
  "cloudconvert.com",
  "convertio.co",
  "tinywow.com",
  "ezgif.com",
  "pdfescape.com",
  "compressjpeg.com",

  // ACM-VIT legacy websites
  "c2c.acmvit.in",
  "cryptichunt.acmvit.in",
  "examcooker.acmvit.in",
  "unipool.acmvit.in",
  "cli-rpg.acmvit.in",
]);

const isWhitelisted = (url: string) => {
  try {
    const host = new URL(ensureHttps(url)).hostname; // normalize
    return IFRAME_WHITELIST.has(host);
  } catch {
    return false;
  }
};

const useRotatingPlaceholder = (
  websites: string[],
  interval: number = 1000,
) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % websites.length);
    }, interval);

    return () => clearInterval(timer);
  }, [websites.length, interval]);

  return websites[currentIndex];
};

const INTERNAL_KEYWORDS = new Set([
  "cc",
  "management",
  "tech",
  "design",
  "research",
  "events",
  "domains",
  "pintoorun",
  "snake",
]);

interface HomePageNavbarProps {
  onNavigate: (keyword: string) => void;
}

const HomePageNavbar: React.FC<HomePageNavbarProps> = ({ onNavigate }) => {
  const bookmarkLabels: Record<string, string> = {
    cc: "CC",
    management: "Management",
    tech: "Tech",
    design: "Design",
    research: "Research",
    events: "Events",
    domains: "Domains",
    pintoorun: "PintooRun",
    snake: "SnakeGame",
  };

  return (
    <nav className="w-full bg-[#555] text-white py-2">
      <ul className="flex items-center justify-center pl-8 gap-6 text-sm font-semibold">
        {Array.from(INTERNAL_KEYWORDS).map((item, index) => (
          <React.Fragment key={item}>
            <li>
              <button
                type="button"
                onClick={() => onNavigate(item)}
                className="hover:text-gray-300 transition-colors"
              >
                {bookmarkLabels[item] || item}
              </button>
            </li>

            {index < Array.from(INTERNAL_KEYWORDS).length - 1 && (
              <span className="h-4 w-px bg-gray-300 opacity-40" />
            )}
          </React.Fragment>
        ))}
      </ul>
    </nav>
  );
};

interface PageHistory {
  id: number;
  title: string;
  url: string;
}

export interface TabData {
  id: number;
  title: string;
  showCc: boolean;
  showManagement: boolean;
  showTech: boolean;
  showDesign: boolean;
  showResearch: boolean;
  showEvents: boolean;
  showDomains: boolean;
  history: PageHistory[];
  pointer: number;
  pendingUrl?: string;
  showPintooRun: boolean;
  showSnake: boolean;
}

interface TabProps {
  tabData: TabData;
  onUpdateTab: (updatedTab: TabData) => void;
  onAddTabWithUrl: (url: string) => void;
  children?: React.ReactNode;
  ccChildren?: React.ReactNode;
  designChildren?: React.ReactNode;
  managementChildren?: React.ReactNode;
  techChildren?: React.ReactNode;
  researchChildren?: React.ReactNode;
}

const stripProtocol = (s: string) => s.replace(/^https?:\/\//i, "");
const ensureHttps = (hostOrUrl: string) =>
  /^https?:\/\//i.test(hostOrUrl) ? hostOrUrl : `https://${hostOrUrl}`;

const currentHostFromPointer = (tabData: TabData) => {
  if (tabData.pendingUrl) return stripProtocol(tabData.pendingUrl);
  if (tabData.pointer >= 0 && tabData.history[tabData.pointer]) {
    return stripProtocol(tabData.history[tabData.pointer].url);
  }
  return "";
};

const requestFullscreen = () => {
  const elem = document.documentElement;
  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.log("Error attempting to enable fullscreen:", err);
      });
    }
  }
};

const Tab: React.FC<TabProps> = ({
  tabData,
  onUpdateTab,
  onAddTabWithUrl,
  children,
  ccChildren,
  designChildren,
  managementChildren,
  techChildren,
  researchChildren,
}) => {
  // Get session from context
  const { session, isPending } = useSessionContext();

  const [navInput, setNavInput] = useState<string>(() =>
    currentHostFromPointer(tabData),
  );
  const [homeInput, setHomeInput] = useState<string>(() =>
    currentHostFromPointer(tabData),
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [iframeError, setIframeError] = useState(false);
  const navInputRef = useRef<HTMLInputElement>(null);

  const rotatingPlaceholder = useRotatingPlaceholder(ROTATING_WEBSITES, 5000);

  useEffect(() => {
    const v = currentHostFromPointer(tabData);
    setNavInput(v);
    setHomeInput(v);
    setIframeError(false);
  }, [tabData]);

  useEffect(() => {
    const activePageData = tabData.history[tabData.pointer];
    const show404Game =
      iframeError ||
      (activePageData?.url && !isWhitelisted(activePageData.url));

    if (show404Game && navInputRef.current) {
      navInputRef.current.blur();
    }
  }, [iframeError, tabData.pointer, tabData.history]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "NAVIGATE_TO" && event.data?.url) {
        onAddTabWithUrl(event.data.url);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onAddTabWithUrl]);

  const handleNavChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setNavInput(stripProtocol(e.target.value));
  const handleHomeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setHomeInput(stripProtocol(e.target.value));

  const commitFrom = async (raw: string) => {
    const inputValue = raw.trim();
    if (!inputValue) return;
    const trimmed = inputValue.toLowerCase();

    const currentUrl =
      tabData.pointer >= 0 ? (tabData.history[tabData.pointer]?.url ?? "") : "";

    requestFullscreen();

    if (INTERNAL_KEYWORDS.has(trimmed)) {
      if (currentUrl === trimmed) return;

      const newPage: PageHistory = {
        id: Date.now(),
        title: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
        url: trimmed,
      };

      const newHistory = tabData.history.slice(0, tabData.pointer + 1);
      if (newHistory.length === 0) {
        newHistory.push({ id: Date.now() - 1, title: "Home", url: "" });
      }
      newHistory.push(newPage);

      onUpdateTab({
        ...tabData,
        showCc: trimmed === "cc",
        showManagement: trimmed === "management",
        showTech: trimmed === "tech",
        showDesign: trimmed === "design",
        showResearch: trimmed === "research",
        showEvents: trimmed === "events",
        showDomains: trimmed === "domains",
        showPintooRun: trimmed === "pintoorun",
        showSnake: trimmed === "snake",
        history: newHistory,
        pointer: newHistory.length - 1,
        title:
          trimmed === "cc"
            ? "CC"
            : trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
        pendingUrl: trimmed,
      });

      return;
    }

    const formatted = ensureHttps(inputValue);

    if (currentUrl === formatted) return;

    const newPage: PageHistory = {
      id: Date.now(),
      title: inputValue,
      url: formatted,
    };

    const newHistory = tabData.history.slice(0, tabData.pointer + 1);
    if (newHistory.length === 0) {
      newHistory.push({ id: Date.now() - 1, title: "Home", url: "" });
    }
    newHistory.push(newPage);

    onUpdateTab({
      ...tabData,
      history: newHistory,
      pointer: newHistory.length - 1,
      title: inputValue,
      pendingUrl: inputValue,
      showManagement: false,
      showCc: false,
      showTech: false,
      showDesign: false,
      showResearch: false,
      showPintooRun: false,
      showEvents: false,
      showDomains: false,
      showSnake: false,
    });

    if (!isWhitelisted(formatted)) {
      setTimeout(() => {
        setIframeError(true);
      }, 2000);
    } else {
      setIframeError(false);
    }
  };

  const handleNavKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitFrom(navInput);
      return;
    }
    if (e.key === "Tab" && !navInput.trim()) {
      e.preventDefault();
      commitFrom("acmvit.in");
    }
  };

  const handleHomeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitFrom(homeInput);
      return;
    }
    if (e.key === "Tab" && !homeInput.trim()) {
      e.preventDefault();
      commitFrom("acmvit.in");
    }
  };

  const goPrevious = () => {
    if (tabData.pointer > 0) {
      const newPointer = tabData.pointer - 1;
      const entry = tabData.history[newPointer];
      const rawUrl = entry.url;
      const v = stripProtocol(rawUrl);

      if (!rawUrl) {
        onUpdateTab({
          ...tabData,
          pointer: newPointer,
          pendingUrl: undefined,
          title: entry.title || "Home",
          showCc: false,
          showManagement: false,
          showTech: false,
          showDesign: false,
          showDomains: false,
          showEvents: false,
          showResearch: false,
          showPintooRun: false,
          showSnake: false,
        });
        setNavInput("");
        setHomeInput("");
        return;
      }

      onUpdateTab({
        ...tabData,
        pointer: newPointer,
        pendingUrl: v,
        title: v === "cc" ? "CC" : v.charAt(0).toUpperCase() + v.slice(1),
        showCc: v === "cc",
        showManagement: v === "management",
        showTech: v === "tech",
        showDesign: v === "design",
        showResearch: v === "research",
        showEvents: v === "events",
        showDomains: v === "domains",
        showSnake: v === "snake",
        showPintooRun: v === "pintoorun",
      });
      setNavInput(v);
      setHomeInput(v);
    }
  };

  const goHome = () => {
    const currentUrl =
      tabData.pointer >= 0 ? (tabData.history[tabData.pointer]?.url ?? "") : "";
    if (currentUrl === "") return;

    const newHistory = tabData.history.slice(0, tabData.pointer + 1);
    newHistory.push({
      id: Date.now(),
      title: "Home",
      url: "",
    });

    onUpdateTab({
      ...tabData,
      history: newHistory,
      pointer: newHistory.length - 1,
      pendingUrl: undefined,
      title: "Home",
      showEvents: false,
      showDomains: false,
      showCc: false,
      showManagement: false,
      showTech: false,
      showDesign: false,
      showResearch: false,
      showPintooRun: false,
      showSnake: false,
    });

    setNavInput("");
    setHomeInput("");
  };

  const goNext = () => {
    if (tabData.pointer < tabData.history.length - 1) {
      const newPointer = tabData.pointer + 1;
      const entry = tabData.history[newPointer];
      const rawUrl = entry.url;
      const v = stripProtocol(rawUrl);

      if (!rawUrl) {
        onUpdateTab({
          ...tabData,
          pointer: newPointer,
          pendingUrl: undefined,
          title: entry.title || "Home",
          showCc: false,
          showManagement: false,
          showTech: false,
          showDesign: false,
          showDomains: false,
          showEvents: false,
          showResearch: false,
          showPintooRun: false,
          showSnake: false,
        });
        setNavInput("");
        setHomeInput("");
        return;
      }

      onUpdateTab({
        ...tabData,
        pointer: newPointer,
        pendingUrl: v,
        title: v === "cc" ? "CC" : v.charAt(0).toUpperCase() + v.slice(1),
        showCc: v === "cc",
        showManagement: v === "management",
        showTech: v === "tech",
        showDesign: v === "design",
        showResearch: v === "research",
        showDomains: v === "domains",
        showEvents: v === "events",
        showPintooRun: v === "pintoorun",
        showSnake: v === "snake",
      });
      setNavInput(v);
      setHomeInput(v);
    }
  };

  const handleRefresh = () => {
    // Increment refresh key to force re-render of client components
    setRefreshKey((prev) => prev + 1);

    // Also reload iframe if present
    const iframe = document.querySelector(
      'iframe[title="Browser Tab"]',
    ) as HTMLIFrameElement;
    if (iframe?.src) {
      const currentSrc = iframe.src;
      iframe.src = currentSrc;
    }
  };

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-blue-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Render authenticated content
  const activePageData = tabData.history[tabData.pointer];
  const navIconButtonBase =
    "flex items-center justify-center text-neutral-500 rounded-md border border-transparent transition duration-150 hover:text-neutral-900 hover:bg-white/70 hover:border-white/80 active:bg-white active:border-white focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent";
  const navIconButton = `${navIconButtonBase} px-2.5 py-1`;
  const navIconButtonCompact = `${navIconButtonBase} px-2 py-1`;
  const navIconButtonDisabled =
    "opacity-40 cursor-not-allowed pointer-events-none hover:text-neutral-500";

  return (
    <div className="flex flex-col h-full w-full">
      {/* Navigation Bar */}
      <div className="w-full bg-[#ffffff]">
        <div className="flex items-center gap-2.5 px-4 py-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={`${navIconButton} ${
                tabData.pointer <= 0 ? navIconButtonDisabled : ""
              }`}
              onClick={goPrevious}
              disabled={tabData.pointer <= 0}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15.25 19.25 8.75 12l6.5-7.25" />
              </svg>
            </button>
            <button
              type="button"
              className={`${navIconButton} ${
                tabData.pointer >= tabData.history.length - 1
                  ? navIconButtonDisabled
                  : ""
              }`}
              onClick={goNext}
              disabled={tabData.pointer >= tabData.history.length - 1}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m8.75 4.75 6.5 7.25-6.5 7.25" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <RefreshButton
              className={navIconButtonCompact}
              onRefresh={handleRefresh}
            />
            <button
              type="button"
              className={navIconButton}
              onClick={goHome}
              aria-label="Home"
            >
              <Image
                src="/home-button.svg"
                alt="Home"
                width={18}
                height={18}
                draggable={false}
                className="w-4 h-4 transition-transform duration-200 hover:scale-110"
              />
            </button>
          </div>

          <div className="flex flex-1 items-center gap-3">
            <div className="flex flex-1 items-center h-10 font-poppinsReg rounded-lg bg-gradient-to-b from-[#9e9e9e] to-[#cdcdcd] pl-4 pr-1 shadow-[inset_0_1px_3px_rgba(255,255,255,0.35),inset_0_4px_10px_rgba(0,0,0,0.3)] gap-0">
              <span className="text-neutral-50 select-none font-medium tracking-tight">
                https://
              </span>
              <input
                ref={navInputRef}
                className="flex-1 bg-transparent outline-none text-white placeholder-neutral-100/70 tracking-tight"
                value={navInput}
                onChange={handleNavChange}
                onKeyDown={handleNavKeyPress}
                placeholder={rotatingPlaceholder}
              />
              <button
                type="button"
                aria-label="Search"
                className="flex min-w-[34px] items-center justify-center rounded-lg bg-white px-3 py-1.5 text-neutral-600 shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition duration-150 hover:bg-white hover:text-neutral-800 hover:shadow-[0_3px_8px_rgba(0,0,0,0.24)] active:bg-neutral-100 active:shadow-[0_1px_2px_rgba(0,0,0,0.2)] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
                onClick={() => commitFrom(navInput)}
              >
                <svg
                  aria-label="Search"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <title>Search icon</title>
                  <circle cx="11" cy="11" r="5.5" />
                  <path strokeLinecap="round" d="m15.5 15.5 3 3" />
                </svg>
              </button>
            </div>
          </div>

          <div className="ml-3">
            <ProfileButton />
          </div>
        </div>
      </div>
      {/* Content Area */}
      <div className="relative flex-1 min-h-0 w-full overflow-y-auto bg-[#080808] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {!session?.data &&
        (tabData.showManagement ||
          tabData.showCc ||
          tabData.showDesign ||
          tabData.showPintooRun ||
          tabData.showResearch ||
          tabData.showTech) ? (
          <SignupPage onSignIn={() => {}} />
        ) : tabData.showManagement ? (
          <div
            key={refreshKey}
            className="w-full h-full bg-white overflow-auto relative"
          >
            <div className="h-full flex items-center justify-center">
              {managementChildren}
            </div>
          </div>
        ) : tabData.showEvents ? (
          <div
            key={refreshKey}
            className="w-full h-full bg-white overflow-auto hide-scrollbar relative"
          >
            <div className="min-h-screen flex items-center justify-center">
              <Events />
            </div>
          </div>
        ) : tabData.showDomains ? (
          <div
            key={refreshKey}
            className="w-full h-full bg-white overflow-auto hide-scrollbar relative"
          >
            <div className="min-h-screen flex items-center justify-center">
              <Domains />
            </div>
          </div>
        ) : tabData.showCc ? (
          <div
            key={refreshKey}
            className="w-full h-full bg-white overflow-auto relative"
          >
            <div className="h-full flex items-center justify-center">
              {ccChildren}
            </div>
          </div>
        ) : tabData.showTech ? (
          <div
            key={refreshKey}
            className="w-full h-full bg-white overflow-auto relative"
          >
            <div className="h-full flex items-center justify-center">
              {techChildren}
            </div>
          </div>
        ) : tabData.showDesign ? (
          <div
            key={refreshKey}
            className="w-full h-full bg-white overflow-auto relative"
          >
            {designChildren}
          </div>
        ) : tabData.showResearch ? (
          <div
            key={refreshKey}
            className="w-full h-full bg-white overflow-auto relative"
          >
            {researchChildren}
          </div>
        ) : tabData.showPintooRun ? (
          <div className="w-full h-full bg-[#1A1A1A] overflow-hidden relative">
            <PintooRun key={refreshKey} />
          </div>
        ) : tabData.showSnake ? (
          <div className="w-full h-full bg-[#1A1A1A] overflow-auto relative">
            <SnakeClient key={refreshKey} />
          </div>
        ) : activePageData?.url ? (
          iframeError || !isWhitelisted(activePageData.url) ? (
            <BrickGame404 key={refreshKey} onExit={goHome} />
          ) : (
            <iframe
              key={activePageData.url}
              className="w-full h-full"
              src={activePageData.url}
              title="Browser Tab"
              allowFullScreen
              onError={() => setIframeError(true)}
            ></iframe>
          )
        ) : (
          <div>
            <HomePageNavbar onNavigate={(keyword) => commitFrom(keyword)} />
            <HomePage
              query={homeInput}
              onQueryChange={handleHomeChange}
              onQueryKeyDown={handleHomeKeyPress}
              onNavigateKeyword={(keyword) => commitFrom(keyword)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Tab;
