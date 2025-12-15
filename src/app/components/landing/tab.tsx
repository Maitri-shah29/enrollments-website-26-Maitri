"use client";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { logSearch } from "@/app/actions/log-search";
import About from "@/app/clients/about-acm-client";
import Domains from "@/app/clients/domains-client";
import Events from "@/app/clients/events-client";
import SnakeClient from "@/app/clients/snake-client";
import { Loader } from "@/components/loader";
import { useSearchHistory } from "@/hooks/use-search-history";
import BrickGame404 from "../brick-game-404";
import Instructions from "../instructions";
import PhoneNumberModal from "../phone-number-modal";
import { useSessionContext } from "../session-provider"; // Adjust path as needed
import SignupPage from "../sign-up";
import HomePage from "./home-page";
import HomePageNavbar from "./home-page-navbar";
import { INTERNAL_KEYWORDS, ROTATING_WEBSITES } from "./tab-constants";
import TabHeader from "./tab-header";
import {
  currentHostFromPointer,
  ensureHttps,
  isWhitelisted,
  requestFullscreen,
  resetTabFlags,
  stripProtocol,
  tabFlagsForKeyword,
  titleForKeyword,
} from "./tab-utils";
import { useRotatingPlaceholder } from "./use-rotating-placeholder";

interface PageHistory {
  id: number;
  title: string;
  url: string;
}

export interface TabData {
  id: number;
  title: string;
  showInstructions: boolean;
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
  // showPintooRun: boolean;
  showSnake: boolean;
  showAbout: boolean;
}

interface TabProps {
  tabData: TabData;
  onUpdateTab: (updatedTab: TabData) => void;
  onAddTabWithUrl: (url: string) => void;
  children?: ReactNode;
  ccChildren?: ReactNode;
  designChildren?: ReactNode;
  managementChildren?: ReactNode;
  techChildren?: ReactNode;
  researchChildren?: ReactNode;
}

const Tab: React.FC<TabProps> = ({
  tabData,
  onUpdateTab,
  onAddTabWithUrl,
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [iframeError, setIframeError] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navInputRef = useRef<HTMLInputElement>(null);
  const { history, addToHistory, removeFromHistory } = useSearchHistory();

  const handleGetStarted = () => {
    localStorage.setItem("hasSeenInstructions", "true");
    // Navigate to home page
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
      ...resetTabFlags(),
    });
    setNavInput("");
  };

  const rotatingPlaceholder = useRotatingPlaceholder(ROTATING_WEBSITES, 5000);

  useEffect(() => {
    const v = currentHostFromPointer(tabData);
    setNavInput(v);
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
        ...tabFlagsForKeyword(trimmed),
        history: newHistory,
        pointer: newHistory.length - 1,
        title: titleForKeyword(trimmed),
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
      ...resetTabFlags(),
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
          ...resetTabFlags(),
        });
        setNavInput("");
        return;
      }

      onUpdateTab({
        ...tabData,
        pointer: newPointer,
        pendingUrl: v,
        title: titleForKeyword(v),
        ...tabFlagsForKeyword(v),
      });
      setNavInput(v);
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
      ...resetTabFlags(),
    });

    setNavInput("");
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
          ...resetTabFlags(),
        });
        setNavInput("");
        return;
      }

      onUpdateTab({
        ...tabData,
        pointer: newPointer,
        pendingUrl: v,
        title: titleForKeyword(v),
        ...tabFlagsForKeyword(v),
      });
      setNavInput(v);
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

  return (
    <div className="flex flex-col h-full w-full">
      {/* Phone Number Modal - shows automatically when user is logged in without phone */}
      <PhoneNumberModal />
      <TabHeader
        canGoBack={tabData.pointer > 0}
        canGoForward={tabData.pointer < tabData.history.length - 1}
        onBack={goPrevious}
        onForward={goNext}
        onHome={goHome}
        onRefresh={handleRefresh}
        navInput={navInput}
        navInputRef={navInputRef}
        placeholder={rotatingPlaceholder}
        onNavChange={handleNavChange}
        onNavKeyDown={handleNavKeyPress}
        onNavCommit={() => commitFrom(navInput)}
        history={history}
        isFocused={isFocused}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        onSelectHistoryItem={(item) => {
          setNavInput(item);
          commitFrom(item);
        }}
        onRemoveHistoryItem={(item) => removeFromHistory(item)}
      />
      {/* Content Area */}
      <div className="relative flex-1 min-h-0 w-full overflow-y-auto bg-[#080808] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {(navLoading || tabData.pendingUrl) && (
          <Loader
            size="100vw"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        )}
        {tabData.showInstructions ? (
          <Instructions onGetStarted={handleGetStarted} />
        ) : !session?.data &&
          (tabData.showManagement ||
            tabData.showCc ||
            tabData.showDesign ||
            // tabData.showPintooRun ||
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
          // ) : tabData.showPintooRun ? (
          //   <div className="w-full h-full bg-[#1A1A1A] overflow-hidden relative">
          //     <PintooRun key={refreshKey} />
          //   </div>
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
          <div className="h-full flex flex-col overflow-hidden">
            <HomePageNavbar onNavigate={(keyword) => commitFrom(keyword)} />
            <div className="flex-1 min-h-0 overflow-auto">
              <HomePage onNavigateKeyword={(keyword) => commitFrom(keyword)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tab;
