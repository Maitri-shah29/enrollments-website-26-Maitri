"use client";
import { type DragEvent, Fragment, useEffect, useState } from "react";
import type { ResultsSummary } from "@/lib/results";
import FullscreenToggle from "./fullscreen-toggle";
import Instructions from "./instructions";
import Tab, { type TabData } from "./landing/tab";
import {
  INTERNAL_KEYWORDS,
  normalizeInternalKeyword,
  titleFromDomain,
} from "./landing/tab-constants";
import {
  ensureHttps,
  resetTabFlags,
  stripProtocol,
  tabFlagsForKeyword,
  titleForKeyword,
} from "./landing/tab-utils";
import App from "./loader/App";
import { useSessionContext } from "./session-provider"; // Adjust path as needed

const buildMaskUrl = (path: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${path}' fill='black'/></svg>`,
  )}")`;

const TAB_MASK_IMAGE = buildMaskUrl(
  "M0 100 L8 15 Q9 3 11 1 Q13 0 16 0 L84 0 Q87 0 89 1 Q91 3 92 15 L100 100 Z",
);
const PLUS_BUTTON_MASK_IMAGE = buildMaskUrl(
  "M8 12 Q7 0 10 0 L66 0 Q70 0 72 4 L95 95 Q97 100 92 100 L34 100 Q30 100 28 96 L8 20 Q7 16 8 12 Z",
);

const buildEmptyTab = (id: number): TabData => ({
  id,
  title: "New Tab",
  showInstructions: false,
  showCc: false,
  showManagement: false,
  showTech: false,
  showDesign: false,
  showResearch: false,
  showEvents: false,
  showDomains: false,
  // showPintooRun: false,
  showMeets: false,
  showSnake: false,
  showAbout: false,
  showScheduler: false,
  showTask: false,
  history: [],
  pointer: -1,
});

const applyInputToTab = (tab: TabData, rawInput: string): TabData => {
  const trimmed = rawInput.trim();
  if (!trimmed) return tab;

  const lower = trimmed.toLowerCase();
  const isInternal = INTERNAL_KEYWORDS.has(lower);
  const normalized = isInternal ? normalizeInternalKeyword(lower) : trimmed;
  const historyUrl = isInternal ? normalized : ensureHttps(trimmed);
  const title = isInternal ? titleFromDomain(normalized) : trimmed;

  const newHistory = tab.history.slice(0, tab.pointer + 1);
  if (newHistory.length === 0) {
    newHistory.push({ id: Date.now() - 1, title: "Home", url: "" });
  }
  newHistory.push({ id: Date.now(), title, url: historyUrl });

  return {
    ...tab,
    history: newHistory,
    pointer: newHistory.length - 1,
    title,
    pendingUrl: normalized,
    ...(isInternal ? tabFlagsForKeyword(normalized) : resetTabFlags()),
  };
};

const resolveInitialPath = (value: string) => {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getInitialPathFromLocation = () => {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("path") || "";
};

const applyInitialNavigation = (
  savedTabs: TabData[],
  activeTabId: number,
  rawInitial: string,
) => {
  const cleaned = rawInitial.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!cleaned) {
    return { tabs: savedTabs, activeTabId };
  }

  const lowered = cleaned.toLowerCase();
  const isInternal = INTERNAL_KEYWORDS.has(lowered);
  const normalized = isInternal ? normalizeInternalKeyword(lowered) : cleaned;
  const targetUrl = isInternal ? normalized : ensureHttps(cleaned);

  const existingTab = savedTabs.find((tab) => {
    const currentUrl =
      tab.pointer >= 0 ? (tab.history[tab.pointer]?.url ?? "") : "";
    return currentUrl === targetUrl;
  });

  if (existingTab) {
    return { tabs: savedTabs, activeTabId: existingTab.id };
  }

  if (savedTabs.length < 6) {
    const newId = Date.now();
    const newTab = applyInputToTab(buildEmptyTab(newId), cleaned);
    return { tabs: [...savedTabs, newTab], activeTabId: newId };
  }

  return {
    tabs: savedTabs.map((tab) =>
      tab.id === activeTabId ? applyInputToTab(tab, cleaned) : tab,
    ),
    activeTabId,
  };
};

// const logInitialState = (label: string, payload: Record<string, unknown>) => {
//   if (process.env.NODE_ENV === "production") return;
//   console.log(`[landing] ${label}`, payload);
// };

// Main Landing Component
const Landing: React.FC<{
  session: unknown;
  isAllowed: boolean;
  children?: React.ReactNode; // legacy
  ccChild?: React.ReactNode;
  designChild?: React.ReactNode;
  managementChild?: React.ReactNode;
  techChild?: React.ReactNode;
  researchChild?: React.ReactNode;
  schedulerChild?: React.ReactNode;
  taskChild?: React.ReactNode;
  initialUrl?: string;
  promotedDomains?: string[];
  resultsSummary?: ResultsSummary | null;
}> = ({
  session: _session,
  isAllowed: _isAllowed,
  ccChild,
  designChild,
  managementChild,
  techChild,
  researchChild,
  schedulerChild,
  taskChild,
  initialUrl,
  promotedDomains = [],
  resultsSummary,
}) => {
  const { isPending } = useSessionContext();
  const initialId = Date.now();

  const [initialState] = useState(() => {
    const fallbackTabs = [buildEmptyTab(initialId)];
    if (typeof window === "undefined") {
      const resolved = resolveInitialPath(initialUrl || "");
      if (!resolved) {
        return { tabs: fallbackTabs, activeTabId: fallbackTabs[0].id };
      }
      return applyInitialNavigation(fallbackTabs, fallbackTabs[0].id, resolved);
    }

    let savedTabs = fallbackTabs;
    try {
      const stored = localStorage.getItem("browserTabs");
      if (stored) {
        const parsed = JSON.parse(stored);
        savedTabs = parsed.length > 0 ? parsed : fallbackTabs;
      }
    } catch (error) {
      console.error("Failed to load tabs from localStorage:", error);
    }

    let savedActiveTabId = savedTabs[0]?.id ?? initialId;
    try {
      const storedActiveTabId = localStorage.getItem("activeTabId");
      if (storedActiveTabId) {
        const exists = savedTabs.some(
          (tab) => tab.id === Number(storedActiveTabId),
        );
        if (exists) {
          savedActiveTabId = Number(storedActiveTabId);
        }
      }
    } catch (error) {
      console.error("Failed to load activeTabId from localStorage:", error);
    }

    const resolved = resolveInitialPath(
      initialUrl || getInitialPathFromLocation(),
    );
    if (!resolved) {
      return { tabs: savedTabs, activeTabId: savedActiveTabId };
    }

    return applyInitialNavigation(savedTabs, savedActiveTabId, resolved);
  });

  const [tabs, setTabs] = useState<TabData[]>(() => initialState.tabs);
  const [activeTabId, setActiveTabId] = useState<number>(
    () => initialState.activeTabId,
  );

  const [draggingTabId, setDraggingTabId] = useState<number | null>(null);
  const [showMaxTabsNotification, setShowMaxTabsNotification] = useState(false);
  const [closingGhost, setClosingGhost] = useState<{
    tab: TabData;
    rect: DOMRect;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("browserTabs", JSON.stringify(tabs));
      } catch (error) {
        console.error("Failed to save tabs to localStorage:", error);
      }
    }
  }, [tabs]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("activeTabId", String(activeTabId));
      } catch (error) {
        console.error("Failed to save activeTabId to localStorage:", error);
      }
    }
  }, [activeTabId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("path")) return;
    // logInitialState("clear-query", { before: window.location.search });
    window.history.replaceState({}, "", "/");
  }, []);

  // Dynamic Favicon Logic
  useEffect(() => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) return;

    let currentUrl = "";
    if (activeTab.pointer >= 0 && activeTab.history[activeTab.pointer]) {
      currentUrl = activeTab.history[activeTab.pointer].url.toLowerCase();
    }

    const faviconMapping: Record<string, string> = {
      cc: "/cc.png",
      tech: "/tech.png",
      design: "/design.png",
      management: "/mgmt.png",
      research: "/research.png",
    };

    const newFavicon = faviconMapping[currentUrl] || "/acm-logo.png";

    const link =
      (document.querySelector("link[rel*='icon']") as HTMLLinkElement) ||
      document.createElement("link");
    link.type = "image/png";
    link.rel = "icon";
    link.href = newFavicon;

    if (!document.querySelector("link[rel*='icon']")) {
      document.head.appendChild(link);
    }
  }, [activeTabId, tabs]);

  // Show animation only on true first load (first visit in this browser session)
  // null = loading (checking localStorage), true = show animation, false = skip animation
  const [showAnimation, setShowAnimation] = useState<boolean | null>(null);
  const [startAnimation, setStartAnimation] = useState(false);
  // Show instructions after animation completes
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasSeenAnimation = localStorage.getItem("hasSeenAnimation");
    const hasSeenInstructions = localStorage.getItem("hasSeenInstructions");

    if (hasSeenAnimation === "true" && hasSeenInstructions === "true") {
      // User has seen both animation and instructions - go to main page
      setShowAnimation(false);
      setShowInstructions(false);
      return;
    }

    if (hasSeenAnimation === "true" && hasSeenInstructions !== "true") {
      // User has seen animation but not instructions - show instructions
      setShowAnimation(false);
      setShowInstructions(true);
      return;
    }

    // First visit - show animation
    setShowAnimation(true);

    // Add keydown/click listener to start animation on any key press or click
    const handleInteraction = () => {
      localStorage.setItem("hasSeenAnimation", "true");
      setStartAnimation(true);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("click", handleInteraction);
    };

    document.addEventListener("keydown", handleInteraction);
    document.addEventListener("click", handleInteraction);
    return () => {
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("click", handleInteraction);
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "SWITCH_TAB" &&
        event.data?.url &&
        typeof window !== "undefined"
      ) {
        const url = event.data.url;
        const meetingId = event.data.meetingId;
        const stripped = stripProtocol(url);

        setTabs((prevTabs) => {
          return prevTabs.map((t) => {
            if (t.id === activeTabId) {
              const newHistory = t.history.slice(0, t.pointer + 1);
              newHistory.push({
                id: Date.now(),
                title: titleForKeyword(stripped),
                url: stripped,
              });

              return {
                ...t,
                ...resetTabFlags(),
                ...tabFlagsForKeyword(stripped),
                history: newHistory,
                pointer: newHistory.length - 1,
                title: titleForKeyword(stripped),
                meetingId: meetingId,
                pendingUrl: stripped,
              };
            }
            return t;
          });
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [activeTabId]);

  useEffect(() => {
    if (!startAnimation) return;

    // Play audio when animation starts
    const audio = new Audio("/ambient-piano.mp3");
    audio.play().catch(() => {});

    // Hide animation after 15 seconds and show instructions
    const timer = setTimeout(() => {
      setShowAnimation(false);
      setShowInstructions(true);
      audio.pause();
    }, 15000);

    return () => {
      clearTimeout(timer);
      audio.pause();
    };
  }, [startAnimation]);

  // Handler for when user clicks "Start Exploring" in instructions
  const handleGetStarted = () => {
    localStorage.setItem("hasSeenInstructions", "true");
    setShowInstructions(false);
  };

  // Show black screen while checking localStorage (prevents white flash)
  if (showAnimation === null) {
    return <div className="fixed inset-0 z-[1000] bg-black" />;
  }

  if (showAnimation && startAnimation)
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
        <App startTime={Date.now()} />
      </div>
    );

  if (showAnimation && !startAnimation)
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl font-semibold animate-pulse">
            PRESS ANY KEY TO CONTINUE
          </p>
        </div>
      </div>
    );

  // Show instructions after animation
  if (showInstructions)
    return (
      <div className="fixed inset-0 z-[1]">
        <Instructions onGetStarted={handleGetStarted} />
      </div>
    );

  if (isPending) return null;

  const addTab = () => {
    if (tabs.length >= 6) {
      setShowMaxTabsNotification(true);
      setTimeout(() => setShowMaxTabsNotification(false), 3000);
      return;
    }
    const newId = Date.now();
    setTabs([...tabs, buildEmptyTab(newId)]);
    setActiveTabId(newId);
  };

  const addTabWithUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    const isInternal = INTERNAL_KEYWORDS.has(lower);
    const normalized = isInternal ? normalizeInternalKeyword(lower) : trimmed;
    const historyUrl = isInternal ? normalized : ensureHttps(trimmed);

    // Only check if another tab is currently showing this URL (not entire history)
    const existingTab = tabs.find((tab) => {
      const currentUrl =
        tab.pointer >= 0 ? tab.history[tab.pointer]?.url : null;
      return currentUrl === historyUrl;
    });

    if (existingTab) {
      //setActiveTabId(existingTab.id);
      //return;
    }

    if (tabs.length >= 6) {
      setShowMaxTabsNotification(true);
      setTimeout(() => setShowMaxTabsNotification(false), 3000);
      return;
    }

    const newId = Date.now() + Math.random();
    const title = isInternal
      ? titleFromDomain(normalized)
      : stripProtocol(historyUrl).split("/")[0];
    const newTab: TabData = {
      id: newId,
      title,
      ...(isInternal ? tabFlagsForKeyword(normalized) : resetTabFlags()),
      history: [
        {
          id: Date.now(),
          title,
          url: historyUrl,
        },
      ],
      pointer: 0,
      pendingUrl: normalized,
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };
  const closeTab = (id: number) => {
    if (tabs.length === 1) return;

    const el = document.getElementById(`tab-${id}`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;

    // Create ghost
    setClosingGhost({ tab, rect });

    // Remove real tab immediately (siblings snap invisibly)
    setTabs((prev) => prev.filter((t) => t.id !== id));

    if (activeTabId === id) {
      const remaining = tabs.filter((t) => t.id !== id);
      if (remaining.length) {
        setActiveTabId(remaining[remaining.length - 1].id);
      }
    }

    // Remove ghost after animation
    setTimeout(() => setClosingGhost(null), 320);
  };

  const updateTab = (updatedTab: TabData) => {
    setTabs(tabs.map((tab) => (tab.id === updatedTab.id ? updatedTab : tab)));
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, id: number) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(id));
    setDraggingTabId(id);
  };

  const handleDragOver = (
    event: DragEvent<HTMLButtonElement>,
    targetId: number,
  ) => {
    event.preventDefault();
    if (draggingTabId === null || draggingTabId === targetId) return;
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    event: DragEvent<HTMLButtonElement>,
    targetId: number,
  ) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    const draggedId = Number(payload);
    if (!draggedId || draggedId === targetId) {
      setDraggingTabId(null);
      return;
    }

    setTabs((prev) => {
      const draggedIndex = prev.findIndex((tab) => tab.id === draggedId);
      const targetIndex = prev.findIndex((tab) => tab.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      const reordered = [...prev];
      const [draggedTab] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, draggedTab);
      return reordered;
    });
    setDraggingTabId(null);
  };

  const handleDragEnd = () => {
    setDraggingTabId(null);
  };

  return (
    <div className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 w-full h-full flex flex-col">
      {showMaxTabsNotification && (
        <div className="fixed top-35 left-1/2 transform -translate-x-1/2 z-[9999] animate-in slide-in-from-top-5 duration-300">
          <div className="bg-gradient-to-r from-red-800 to-red-600 text-white px-6 py-3 rounded-lg shadow-2xl border border-red-400/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <p className="font-medium text-sm">
                You have opened the maximum no. of tabs
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="w-full pl-1 pr-4 pt-4 pb-0 border-b border-white/10 relative overflow-visible bg-neutral-950/50">
        <div className="flex items-end">
          <div className="flex items-end overflow-x-auto overflow-y-visible">
            {tabs.map((tab, index) => {
              const isActive = activeTabId === tab.id;
              return (
                <Fragment key={tab.id}>
                  {closingGhost && (
                    <div
                      className="fixed z-50 pointer-events-none"
                      style={{
                        left: closingGhost.rect.left,
                        top: closingGhost.rect.top,
                        width: closingGhost.rect.width,
                        height: closingGhost.rect.height,
                        WebkitMaskImage: TAB_MASK_IMAGE,
                        maskImage: TAB_MASK_IMAGE,
                        WebkitMaskSize: "100% 100%",
                        maskSize: "100% 100%",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        background: "#252525",
                        animation:
                          "tab-close 0ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
                      }}
                    >
                      <div className="flex items-center h-full px-6 text-sm text-white font-medium">
                        {closingGhost.tab.title}
                      </div>
                    </div>
                  )}

                  <button
                    id={`tab-${tab.id}`}
                    type="button"
                    onClick={() => setActiveTabId(tab.id)}
                    onAuxClick={(e) => {
                      // Middle-click (button 1) closes tab
                      if (e.button === 1) {
                        e.preventDefault();
                        closeTab(tab.id);
                      }
                    }}
                    draggable
                    onDragStart={(event) => handleDragStart(event, tab.id)}
                    onDragOver={(event) => handleDragOver(event, tab.id)}
                    onDrop={(event) => handleDrop(event, tab.id)}
                    onDragEnd={handleDragEnd}
                    className={`relative flex items-center flex-shrink-0 h-9 min-w-[13rem] px-6 text-sm font-medium transform-gpu transition-all duration-0 ease-out overflow-visible ${
                      isActive
                        ? "z-40 text-neutral-900 bg-[#FCF7F2]"
                        : "z-20 text-neutral-200 bg-[#252525]"
                    } ${index > 0 ? "-ml-6" : ""} ${
                      draggingTabId === tab.id ? "opacity-70" : ""
                    }`}
                    style={{
                      WebkitMaskImage: TAB_MASK_IMAGE,
                      maskImage: TAB_MASK_IMAGE,
                      WebkitMaskSize: "100% 100%",
                      maskSize: "100% 100%",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                    }}
                  >
                    <span
                      className="truncate pr-4 relative z-10 font-poppinsReg"
                      style={{
                        color: isActive ? "#252525" : "#ffffff",
                      }}
                    >
                      {tab.title.charAt(0).toUpperCase() +
                        tab.title.slice(1).toLowerCase()}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Close tab"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          closeTab(tab.id);
                        }
                      }}
                      className={`ml-auto flex h-4 w-4 items-center justify-center rounded-full transition-colors relative z-10 text-base ${
                        isActive
                          ? "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200"
                          : "text-neutral-400 hover:text-neutral-200 hover:bg-white/10"
                      }`}
                    >
                      ×
                    </span>
                  </button>
                </Fragment>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addTab}
            disabled={tabs.length >= 6}
            className={`relative -left-3 flex h-7 w-16 border-[#252525] bg-[#252525] from-[#585858] to-[#bdbdbd] items-center justify-center text-lg rounded-lg font-semibold transform-gpu transition-all duration-0 ease-out overflow-visible mb-[6px] ${
              tabs.length >= 6
                ? "cursor-not-allowed text-neutral-600 bg-gradient-to-b from-neutral-700/90 to-neutral-800/90"
                : "cursor-pointer text-neutral-200 bg-[#252525] from-[#585858] to-[#bdbdbd] hover:from-neutral-600/90 hover:to-neutral-600/90"
            } z-30 shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]`}
            style={{
              WebkitMaskImage: PLUS_BUTTON_MASK_IMAGE,
              maskImage: PLUS_BUTTON_MASK_IMAGE,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
            }}
          >
            <span className="relative z-10 text-xl leading-none">+</span>
          </button>
          <div className="ml-auto mb-[6px]">
            <FullscreenToggle />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={activeTabId === tab.id ? "block h-full" : "hidden"}
          >
            <Tab
              tabData={tab}
              onUpdateTab={updateTab}
              onAddTabWithUrl={addTabWithUrl}
              ccChildren={ccChild}
              designChildren={designChild}
              managementChildren={managementChild}
              techChildren={techChild}
              researchChildren={researchChild}
              schedulerChildren={schedulerChild}
              taskChildren={taskChild}
              promotedDomains={promotedDomains}
              resultsSummary={resultsSummary}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Landing;
