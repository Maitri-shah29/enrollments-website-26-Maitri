"use client";
import Image from "next/image";
// change
import React, { useEffect, useState } from "react";
import CCClient from "@/app/clients/cc-client";
import DesignClient from "@/app/clients/design-client";
import Management from "@/app/clients/management-client";
import ResearchClient from "@/app/clients/research-client";
import TechWebsite from "@/app/clients/tech-client";
import { signIn } from "@/lib/auth-client";
import ProfileButton from "../profile-button";
import RefreshButton from "../refresh-button";
import { useSessionContext } from "../session-provider"; // Adjust path as needed
import SignupPage from "../sign-up";
import HomePage from "./home-page";

const INTERNAL_KEYWORDS = new Set([
  "cc",
  "management",
  "tech",
  "design",
  "research",
]);

interface HomePageNavbarProps {
  onNavigate: (keyword: string) => void;
}

const HomePageNavbar: React.FC<HomePageNavbarProps> = ({ onNavigate }) => {
  return (
    <nav className="w-full bg-[#555] text-white py-2">
      <ul className="flex items-center justify-center gap-6 text-sm font-semibold">
        {Array.from(INTERNAL_KEYWORDS).map((item, index) => (
          <React.Fragment key={item}>
            <li>
              <button
                type="button"
                onClick={() => onNavigate(item)}
                className="hover:text-gray-300 transition-colors"
              >
                {item}
              </button>
            </li>

            {index < item.length - 1 && (
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
  history: PageHistory[];
  pointer: number;
  pendingUrl?: string;
}

interface TabProps {
  tabData: TabData;
  onUpdateTab: (updatedTab: TabData) => void;
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

const Tab: React.FC<TabProps> = ({ tabData, onUpdateTab }) => {
  // Get session from context
  const { session, isPending } = useSessionContext();

  const [navInput, setNavInput] = useState<string>(() =>
    currentHostFromPointer(tabData),
  );
  const [homeInput, setHomeInput] = useState<string>(() =>
    currentHostFromPointer(tabData),
  );

  useEffect(() => {
    const v = currentHostFromPointer(tabData);
    setNavInput(v);
    setHomeInput(v);
  }, [tabData]);

  const handleNavChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setNavInput(stripProtocol(e.target.value));
  const handleHomeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setHomeInput(stripProtocol(e.target.value));

  const commitFrom = (raw: string) => {
    const inputValue = raw.trim();
    if (!inputValue) return;
    const trimmed = inputValue.toLowerCase();

    if (INTERNAL_KEYWORDS.has(trimmed)) {
      const newPage: PageHistory = {
        id: Date.now(),
        title: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
        url: trimmed,
      };
      const newHistory = tabData.history.slice(0, tabData.pointer + 1);
      newHistory.push(newPage);
      onUpdateTab({
        ...tabData,
        showCc: trimmed === "cc",
        showManagement: trimmed === "management",
        showTech: trimmed === "tech",
        showDesign: trimmed === "design",
        showResearch: trimmed === "research",
        title:
          trimmed === "cc"
            ? "CC"
            : trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
        pendingUrl: trimmed,
        history: newHistory,
        pointer: newHistory.length - 1,
      });
      return;
    }

    const formatted = ensureHttps(inputValue);
    const newPage: PageHistory = {
      id: Date.now(),
      title: inputValue,
      url: formatted,
    };
    const newHistory = tabData.history.slice(0, tabData.pointer + 1);
    newHistory.push(newPage);
    onUpdateTab({
      ...tabData,
      history: newHistory,
      pointer: newHistory.length - 1,
      title: inputValue,
      showManagement: false,
      showCc: false,
      showTech: false,
      showDesign: false,
      showResearch: false,
      pendingUrl: inputValue,
    });
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
          showResearch: false,
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
      });
      setNavInput(v);
      setHomeInput(v);
    }
  };

  const goHome = () => {
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
      showCc: false,
      showManagement: false,
      showTech: false,
      showDesign: false,
      showResearch: false,
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
          showResearch: false,
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
      });
      setNavInput(v);
      setHomeInput(v);
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
            <RefreshButton className={navIconButtonCompact} />
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
                className="w-4 h-4"
              />
            </button>
          </div>

          <div className="flex flex-1 items-center gap-3">
            <div className="flex flex-1 items-center h-10 rounded-lg bg-gradient-to-b from-[#585858] to-[#bdbdbd] pl-4 pr-1 shadow-[inset_0_1px_3px_rgba(255,255,255,0.35),inset_0_4px_10px_rgba(0,0,0,0.3)] gap-0">
              <span className="text-neutral-100 select-none font-medium tracking-tight">
                https://
              </span>
              <input
                className="flex-1 bg-transparent outline-none text-neutral-50 placeholder-neutral-200 tracking-tight"
                value={navInput}
                onChange={handleNavChange}
                onKeyDown={handleNavKeyPress}
                placeholder="ocs.acmvit.in"
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
      <div className="relative flex-1 min-h-0 w-full overflow-y-auto bg-[#080808]">
        {!session?.data &&
        (tabData.showManagement ||
          tabData.showCc ||
          tabData.showDesign ||
          tabData.showResearch ||
          tabData.showTech) ? (
          <SignupPage onSignIn={signIn} />
        ) : tabData.showManagement ? (
          <div className="w-full h-full bg-white overflow-auto relative">
            <div className="h-full flex items-center justify-center">
              <Management />
            </div>
          </div>
        ) : tabData.showCc ? (
          <div className="w-full h-full bg-white overflow-auto relative">
            <div className="h-full flex items-center justify-center">
              <CCClient />
            </div>
          </div>
        ) : tabData.showTech ? (
          <div className="w-full h-full bg-white overflow-auto relative">
            <div className="h-full flex items-center justify-center">
              <TechWebsite />
            </div>
          </div>
        ) : tabData.showDesign ? (
          <div className="w-full h-full bg-white overflow-auto relative">
            <DesignClient />
          </div>
        ) : tabData.showResearch ? (
          <div className="w-full h-full bg-white overflow-auto relative">
            <ResearchClient />
          </div>
        ) : activePageData?.url ? (
          <iframe
            key={activePageData.url}
            className="w-full h-full"
            src={activePageData.url}
            title="Browser Tab"
            allowFullScreen
          ></iframe>
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
