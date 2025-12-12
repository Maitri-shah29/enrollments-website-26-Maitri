"use client";
import { type DragEvent, useEffect, useState } from "react";
import Tab, { type TabData } from "./landing/tab";
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
}> = ({
  session: _session,
  isAllowed: _isAllowed,
  ccChild,
  designChild,
  managementChild,
  techChild,
  researchChild,
}) => {
  const { isPending } = useSessionContext();
  const initialId = Date.now();

  const [tabs, setTabs] = useState<TabData[]>(() => {
    if (typeof window === "undefined") {
      return [
        {
          id: initialId,
          title: "New Tab",
          showCc: false,
          showManagement: false,
          showTech: false,
          showDesign: false,
          showResearch: false,
          showEvents: false,
          showDomains: false,
          showPintooRun: false,
          showSnake: false,
          history: [],
          pointer: -1,
        },
      ];
    }

    try {
      const savedTabs = localStorage.getItem("browserTabs");
      if (savedTabs) {
        const parsed = JSON.parse(savedTabs);
        return parsed.length > 0
          ? parsed
          : [
              {
                id: initialId,
                title: "New Tab",
                showCc: false,
                showManagement: false,
                showTech: false,
                showDesign: false,
                showResearch: false,
                showEvents: false,
                showDomains: false,
                showPintooRun: false,
                showSnake: false,
                history: [],
                pointer: -1,
              },
            ];
      }
    } catch (error) {
      console.error("Failed to load tabs from localStorage:", error);
    }

    return [
      {
        id: initialId,
        title: "New Tab",
        showCc: false,
        showManagement: false,
        showTech: false,
        showDesign: false,
        showResearch: false,
        showEvents: false,
        showDomains: false,
        showPintooRun: false,
        showSnake: false,
        history: [],
        pointer: -1,
      },
    ];
  });

  const [activeTabId, setActiveTabId] = useState<number>(() => {
    if (typeof window === "undefined") return initialId;

    try {
      const savedActiveTabId = localStorage.getItem("activeTabId");
      const savedTabs = localStorage.getItem("browserTabs");

      if (savedActiveTabId && savedTabs) {
        const parsed = JSON.parse(savedTabs);
        const tabExists = parsed.some(
          (tab: TabData) => tab.id === Number(savedActiveTabId),
        );
        if (tabExists) {
          return Number(savedActiveTabId);
        }
      }
    } catch (error) {
      console.error("Failed to load activeTabId from localStorage:", error);
    }

    return tabs[0]?.id || initialId;
  });

  const [draggingTabId, setDraggingTabId] = useState<number | null>(null);
  const [showMaxTabsNotification, setShowMaxTabsNotification] = useState(false);

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

  // Show animation only on true first load (first visit in this browser session)
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const hasSeenAnimation = localStorage.getItem("hasSeenAnimation");

    if (hasSeenAnimation) {
      setShowAnimation(false);
    } else {
      setShowAnimation(true);
      localStorage.setItem("hasSeenAnimation", "true");
    }
  }, []);
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasSeenAnimation = localStorage.getItem("hasSeenAnimation");

    if (hasSeenAnimation) {
      setShowAnimation(false);
      return;
    }

    // Add keydown listener to start animation on any key press
    const handleKeyDown = () => {
      localStorage.setItem("hasSeenAnimation", "true");
      setStartAnimation(true);
      document.removeEventListener("keydown", handleKeyDown);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!startAnimation) return;

    // Play audio when animation starts
    const audio = new Audio("/bgm.mp3");
    audio.play().catch(() => {});

    // Hide animation after 15 seconds
    const timer = setTimeout(() => {
      setShowAnimation(false);
      audio.pause();
    }, 15000);

    return () => {
      clearTimeout(timer);
      audio.pause();
    };
  }, [startAnimation]);

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

  if (isPending) return null;

  const addTab = () => {
    if (tabs.length >= 6) {
      setShowMaxTabsNotification(true);
      setTimeout(() => setShowMaxTabsNotification(false), 3000);
      return;
    }
    const newId = Date.now();
    const newTab: TabData = {
      id: newId,
      title: "New Tab",
      showCc: false,
      showManagement: false,
      showTech: false,
      showDesign: false,
      showResearch: false,
      showEvents: false,
      showDomains: false,
      showPintooRun: false,
      showSnake: false,
      history: [],
      pointer: -1,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const addTabWithUrl = (url: string) => {
    const existingTab = tabs.find((tab) =>
      tab.history.some((h) => h.url === url),
    );

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
    const newTab: TabData = {
      id: newId,
      title: url.replace(/^https?:\/\//, "").split("/")[0],
      showCc: url === "cc",
      showManagement: url === "management",
      showTech: url === "tech",
      showDesign: url === "design",
      showResearch: url === "research",
      showEvents: url === "events",
      showDomains: url === "domains",
      showPintooRun: url === "pintoorun",
      showSnake: url === "snake",
      history: [
        {
          id: Date.now(),
          title: url,
          url: url,
        },
      ],
      pointer: 0,
      pendingUrl: url,
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (id: number) => {
    if (tabs.length === 1) {
      setTabs([
        {
          id: tabs[0].id,
          title: "Home",
          showCc: false,
          showManagement: false,
          showTech: false,
          showDesign: false,
          showResearch: false,
          showEvents: false,
          showDomains: false,
          showPintooRun: false,
          showSnake: false,
          history: [],
          pointer: -1,
        },
      ]);
      return;
    }

    const remaining = tabs.filter((tab) => tab.id !== id);
    setTabs(remaining);

    if (activeTabId === id) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
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
    <>
      <div className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 w-full h-full flex flex-col">
        <div className="w-full pl-1 pr-4 pt-4 pb-0 border-b border-white/10 relative overflow-visible bg-neutral-950/50">
          <div className="flex items-end">
            <div className="flex items-end overflow-x-auto overflow-y-visible">
              {tabs.map((tab, index) => {
                const isActive = activeTabId === tab.id;
                return (
                  <button
                    key={tab.id}
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
                    className={`relative flex items-center flex-shrink-0 h-9 min-w-[13rem] px-6 text-sm font-medium transform-gpu transition-all duration-200 ease-out overflow-visible ${
                      isActive
                        ? "z-40 text-neutral-900 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.35)]"
                        : "z-20 text-neutral-200 bg-gradient-to-b from-[#585858] to-[#BDBDBD] shadow-[0_0_0_1px_rgba(69,69,69,1),0_2px_8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]"
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
                        color: isActive ? "#454545" : "#ffffff",
                      }}
                    >
                      {tab.title}
                    </span>
                    <div
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
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addTab}
              disabled={tabs.length >= 6}
              className={`relative -left-3 flex h-7 w-16 border-[#454545] bg-gradient-to-b from-[#585858] to-[#bdbdbd] items-center justify-center text-lg rounded-lg font-semibold transform-gpu transition-all duration-300 ease-out overflow-visible mb-[6px] ${
                tabs.length >= 6
                  ? "cursor-not-allowed text-neutral-600 bg-gradient-to-b from-neutral-700/90 to-neutral-800/90"
                  : "cursor-pointer text-neutral-200 bg-gradient-to-b from-[#585858] to-[#bdbdbd] hover:from-neutral-500/90 hover:to-neutral-600/90"
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
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Landing;
