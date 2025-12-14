"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { logSearch } from "@/app/actions/log-search";
import About from "@/app/clients/about-acm-client";
import Domains from "@/app/clients/domains-client";
import Events from "@/app/clients/events-client";
import PintooRun from "@/app/clients/PintooRun-client";
import SnakeClient from "@/app/clients/snake-client";
import { Loader } from "@/components/loader";
import { useSearchHistory } from "@/hooks/use-search-history";
import BrickGame404 from "../brick-game-404";
import PhoneNumberModal from "../phone-number-modal";
import ProfileButton from "../profile-button";
import RefreshButton from "../refresh-button";
import { useSessionContext } from "../session-provider"; // Adjust path as needed
import SignupPage from "../sign-up";
import HomePage from "./home-page";

const ROTATING_WEBSITES = [
  //"os.acmvit.in",
  "fast.com",
  "acmvit.in",
  "krunker.io",
  "slither.io",
  "skrbbl.io",
  "wikipedia.org",
  "classic.minecraft.net",
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
  //"comick.live",

  // Games & Game Sites
  "slither.io",
  "krunker.io",
  "diep.io",
  "splix.io",
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
  "lichess.org",
  "worldsbiggestpacman.com",
  "snowrider3d.com",
  "slopegame.online",
  "tetr.io",
  "wanderers.io",
  "wormate.io",

  // Coding / Developer Tools
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

  // Design / Drawing / Whiteboards
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

  // Maps / Geo / Visualization
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

  // Google Embeds (Must Use /embed or /preview)
  "docs.google.com/forms",
  "docs.google.com/presentation",
  "docs.google.com/spreadsheets",
  "drive.google.com/file",
  "calendar.google.com/calendar",
  "youtube.com/embed",
  "player.vimeo.com",

  // Audio / Media Embeds
  "open.spotify.com/embed",
  "soundcloud.com",
  "bandcamp.com",
  "radio.garden",
  "tunein.com",
  "anchor.fm",

  // Info / Knowledge / Open Data
  "wikipedia.org",
  "wikimedia.org",
  "archive.org",
  "openlibrary.org",
  "britannica.com",

  // ACM-VIT legacy websites
  "c2c.acmvit.in",
  "cryptichunt.acmvit.in",
  "examcooker.acmvit.in",
  "unipool.acmvit.in",
  "cli-rpg.acmvit.in",

  //CC Resources
  "neetcode.io",
  "cses.fi",
  "algomap.io",
]);

const isWhitelisted = (url: string) => {
  try {
    const host = new URL(ensureHttps(url)).hostname;
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
  "about",
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
    about: "About",
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
  showAbout: boolean;
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
  const [navLoading, setNavLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navInputRef = useRef<HTMLInputElement>(null);
  const { history, addToHistory, removeFromHistory } = useSearchHistory();

  const rotatingPlaceholder = useRotatingPlaceholder(ROTATING_WEBSITES, 5000);

  useEffect(() => {
    const v = currentHostFromPointer(tabData);
    setNavInput(v);
    setHomeInput(v);
    setIframeError(false);
  }, [tabData]);

  useEffect(() => {
    if (!tabData.pendingUrl) {
      setNavLoading(false);
      return;
    }

    setNavLoading(true);
    const timer = setTimeout(() => {
      onUpdateTab({ ...tabData, pendingUrl: undefined });
      setNavLoading(false);
    }, 650);

    return () => clearTimeout(timer);
  }, [tabData, onUpdateTab]);

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

    addToHistory(trimmed);
    if (session?.data?.user?.email) {
      logSearch(trimmed, session.data.user.email);
    }

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
        showAbout: trimmed === "about",
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
      showAbout: false,
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
          showAbout: false,
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
        showAbout: v === "about",
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
      showAbout: false,
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
          showAbout: false,
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
        showAbout: v === "about",
      });
      setNavInput(v);
      setHomeInput(v);
    }
  };

  const handleRefresh = () => {
    // Increment refresh key to force re-render of client components
    setRefreshKey((prev) => prev + 1);

    // Also reload iframe if present (for non-client components)
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
      {/* Phone Number Modal - shows automatically when user is logged in without phone */}
      <PhoneNumberModal />
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
                className="h-5 w-5 transition-transform duration-200 hover:scale-110"
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
                className="h-5 w-5 transition-transform duration-200 hover:scale-110"
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
            <div className="flex flex-1 items-center h-10 font-poppinsReg rounded-lg bg-[#252525] pl-4 pr-1 shadow-[inset_0_1px_3px_rgba(255,255,255,0.35),inset_0_4px_10px_rgba(0,0,0,0.3)] gap-0 relative">
              <span className="text-neutral-50 select-none font-medium tracking-tight">
                https://
              </span>
              <input
                ref={navInputRef}
                className="flex-1 bg-transparent outline-none text-white placeholder-neutral-100/70 tracking-tight"
                value={navInput}
                onChange={handleNavChange}
                onKeyDown={handleNavKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                placeholder={rotatingPlaceholder}
              />
              {isFocused && history.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#252525] rounded-lg shadow-xl border border-white/10 overflow-hidden z-[100]">
                  {history
                    .filter((item) =>
                      item.toLowerCase().includes(navInput.toLowerCase()),
                    )
                    .map((item) => (
                      <div
                        key={item}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 transition-colors group"
                      >
                        <button
                          type="button"
                          className="flex-1 text-left text-white flex items-center gap-2"
                          onClick={() => {
                            setNavInput(item);
                            commitFrom(item);
                          }}
                        >
                          <span className="opacity-50">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <title>History</title>
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          </span>
                          {item}
                        </button>
                        <button
                          type="button"
                          aria-label="Remove from history"
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFromHistory(item);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="#9ca3af"
                          >
                            <title>Remove</title>
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                </div>
              )}
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
        {(navLoading || tabData.pendingUrl) && (
          <Loader
            size="100vw"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        )}
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
            className="w-full h-full overflow-auto hide-scrollbar relative"
          >
            <div className=" flex h-full items-center justify-center">
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
        ) : tabData.showAbout ? (
          <div className="w-full h-full bg-black overflow-auto relative">
            <About key={refreshKey} />
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
          <div className="h-full">
            <HomePageNavbar onNavigate={(keyword) => commitFrom(keyword)} />
            <HomePage onNavigateKeyword={(keyword) => commitFrom(keyword)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Tab;
