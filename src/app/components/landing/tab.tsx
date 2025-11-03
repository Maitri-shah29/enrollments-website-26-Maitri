"use client";
// change
import { useEffect, useState } from "react";
import CCClient from "@/app/clients/cc-client";
import DesignClient from "@/app/clients/design-client";
import Management from "@/app/clients/management-client";
import ResearchClient from "@/app/clients/research-client";
import TechWebsite from "@/app/clients/tech-client";
import ProfileButton from "../profile-button";
import RefreshButton from "../refresh-button";

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
  // last-typed (not-yet-committed) value for this tab's address bar
  pendingUrl?: string;
}

interface TabProps {
  tabData: TabData;
  onUpdateTab: (updatedTab: TabData) => void;
}

const INTERNAL_KEYWORDS = new Set([
  "cc",
  "management",
  "tech",
  "design",
  "research",
]);

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
  // Separate inputs for top navbar and home card so typing in one doesn't mirror the other
  const [navInput, setNavInput] = useState<string>(() =>
    currentHostFromPointer(tabData),
  );
  const [homeInput, setHomeInput] = useState<string>(() =>
    currentHostFromPointer(tabData),
  );

  // Sync inputs when active page changes (keep UX consistent)
  useEffect(() => {
    const v = currentHostFromPointer(tabData);
    setNavInput(v);
    setHomeInput(v);
  }, [tabData]);

  const handleNavChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setNavInput(stripProtocol(e.target.value));
  const handleHomeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setHomeInput(stripProtocol(e.target.value));

  // Centralized commit logic used by either input
  const commitFrom = (raw: string) => {
    const inputValue = raw.trim();
    if (!inputValue) return;
    const trimmed = inputValue.toLowerCase();

    // Handle internal sections
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

    // Handle regular URL navigation
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
      const v = stripProtocol(tabData.history[newPointer].url);
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

  const goNext = () => {
    if (tabData.pointer < tabData.history.length - 1) {
      const newPointer = tabData.pointer + 1;
      const v = stripProtocol(tabData.history[newPointer].url);
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

  const activePageData = tabData.history[tabData.pointer];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Navigation Bar */}
      <div className="w-full bg-blue-800 h-10 flex items-center py-1 px-10 gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="hover:bg-white/10 rounded-full p-2"
            onClick={goPrevious}
            disabled={tabData.pointer <= 0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              aria-label="left arrow"
              viewBox="0 0 512 512"
              width="15"
              height="15"
              fill={tabData.pointer > 0 ? "white" : "grey"}
            >
              <title>Previous</title>
              <path d="M512 224H147.3l136.4-136.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L147.3 288H512c17.7 0 32-14.3 32-32s-14.3-32-32-32z" />
            </svg>
          </button>
          <button
            type="button"
            className="hover:bg-white/10 rounded-full p-2"
            onClick={goNext}
            disabled={tabData.pointer >= tabData.history.length - 1}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              aria-label="right arrow"
              viewBox="0 0 512 512"
              width="15"
              height="15"
              fill={
                tabData.pointer < tabData.history.length - 1 ? "white" : "grey"
              }
            >
              <title>Next</title>
              <path d="M0 288h364.7l-136.4 136.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3l-192-192c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L364.7 224H0c-17.7 0-32 14.3-32 32s14.3 32 32 32z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton className="p-2 rounded hover:bg-white/10" />
        </div>

        <div className="flex items-center w-full h-full bg-blue-700 border-2 border-white rounded-full px-3 text-white justify-center">
          <span className="text-gray-300 select-none">https://</span>
          <input
            className="bg-transparent w-full outline-none text-white"
            value={navInput}
            onChange={handleNavChange}
            onKeyDown={handleNavKeyPress}
            placeholder="acmvit.in"
          />
        </div>

        <div className="ml-auto mb-1">
          <ProfileButton />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full overflow-hidden bg-blue-900 flex flex-col items-center justify-center text-white gap-6 relative">
        {tabData.showManagement ? (
          <div className="w-full h-full bg-white rounded-b-xl overflow-auto relative">
            <div className="h-full flex items-center justify-center">
              <Management />
            </div>
          </div>
        ) : tabData.showCc ? (
          <div className="w-full h-full bg-white rounded-b-xl overflow-auto relative">
            <div className="h-full flex items-center justify-center">
              <CCClient />
            </div>
          </div>
        ) : tabData.showTech ? (
          <div className="w-full h-full bg-white rounded-b-xl overflow-auto relative">
            <div className="h-full flex items-center justify-center">
              <TechWebsite />
            </div>
          </div>
        ) : tabData.showDesign ? (
          <div className="w-full h-full bg-white rounded-b-xl overflow-auto relative">
            <DesignClient />
          </div>
        ) : tabData.showResearch ? (
          <div className="w-full h-full bg-white rounded-b-xl overflow-auto relative">
            <ResearchClient />
          </div>
        ) : activePageData?.url ? (
          <iframe
            key={activePageData.url}
            className="w-full h-full rounded-b-xl"
            src={activePageData.url}
            title="Browser Tab"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="flex flex-col items-center justify-center gap-6 w-full">
            <h1 className="text-6xl font-semibold">ACM-OCS'26</h1>

            <div className="flex items-center w-170 min-w-[400px] h-10 bg-white rounded-full px-3 text-black shadow-md">
              <span className="select-none">https://</span>
              <input
                className="bg-transparent w-full outline-none"
                value={homeInput}
                onChange={handleHomeChange}
                onKeyDown={handleHomeKeyPress}
                placeholder="acmvit.in"
              />
            </div>

            <div className="flex gap-4 flex-wrap justify-center mt-4">
              <button
                type="button"
                onClick={() => {
                  commitFrom("management");
                }}
                className="w-40 h-25 bg-white/70 rounded-xl"
              ></button>
              <button
                type="button"
                onClick={() => {
                  commitFrom("tech");
                }}
                className="w-40 h-25 bg-white/70 rounded-xl"
              ></button>
              <button
                type="button"
                onClick={() => {
                  commitFrom("cc");
                }}
                className="w-40 h-25 bg-white/70 rounded-xl"
              ></button>
              <button
                type="button"
                onClick={() => {
                  commitFrom("design");
                }}
                className="w-40 h-25 bg-white/70 rounded-xl"
              ></button>
              <button
                type="button"
                onClick={() => {
                  commitFrom("research");
                }}
                className="w-40 h-25 bg-white/70 rounded-xl"
              ></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tab;
