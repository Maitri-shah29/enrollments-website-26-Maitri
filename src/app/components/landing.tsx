"use client";
import { type DragEvent, useEffect, useState } from "react";
import Tab, { type TabData } from "./landing/tab";
import { useSessionContext } from "./session-provider"; // Adjust path as needed

// Main Landing Component
const Landing: React.FC = () => {
  const { isPending } = useSessionContext();
  const initialId = Date.now();
  const [tabs, setTabs] = useState<TabData[]>([
    {
      id: initialId,
      title: "New Tab",
      showCc: false,
      showManagement: false,
      showTech: false,
      showDesign: false,
      showResearch: false,
      history: [],
      pointer: -1,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<number>(initialId);
  const [draggingTabId, setDraggingTabId] = useState<number | null>(null);
  const [processingUrl, setProcessingUrl] = useState<string | null>(null);

  // for new tabs from redirection
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "CREATE_NEW_TAB" && event.data?.url) {
        const url = event.data.url;

        if (processingUrl === url) {
          return;
        }

        setProcessingUrl(url);

        setTimeout(() => {
          setTabs((prevTabs) => {
            const existingTab = prevTabs.find((tab) =>
              tab.history.some((h) => h.url === url),
            );

            if (existingTab) {
              setActiveTabId(existingTab.id);
              setProcessingUrl(null);
              return prevTabs;
            }

            const newId = Date.now() + Math.random(); // Ensure unique ID
            const newTab: TabData = {
              id: newId,
              title: url.replace(/^https?:\/\//, "").split("/")[0],
              showCc: false,
              showManagement: false,
              showTech: false,
              showDesign: false,
              showResearch: false,
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

            setActiveTabId(newId);
            setProcessingUrl(null);
            return [...prevTabs, newTab];
          });
        }, 50);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [processingUrl]);

  if (isPending) return null;

  const addTab = () => {
    if (tabs.length >= 6) return;
    const newId = Date.now();
    const newTab: TabData = {
      id: newId,
      title: "New Tab",
      showCc: false,
      showManagement: false,
      showTech: false,
      showDesign: false,
      showResearch: false,
      history: [],
      pointer: -1,
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
    <div className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 w-full h-full flex flex-col">
      <svg
        width="0"
        height="0"
        aria-label="SVG Clip Paths"
        style={{ position: "absolute" }}
      >
        <title>Clip path definitions for landing tabs</title>
        <defs>
          <clipPath id="tabShape" clipPathUnits="objectBoundingBox">
            <path
              d="
              M 0,1
              L 0.08,0.15
              Q 0.09,0.03 0.11,0.01
              Q 0.13,0 0.16,0
              L 0.84,0
              Q 0.87,0 0.89,0.01
              Q 0.91,0.03 0.92,0.15
              L 1,1
              Z
            "
            />
          </clipPath>
          <clipPath id="plusButtonShape" clipPathUnits="objectBoundingBox">
            <path
              d="
              M 0.08,0.08
              Q 0.07,0 0.10,0
              L 0.66,0
              Q 0.70,0 0.72,0.03
              L 0.95,0.95
              Q 0.97,1 0.92,1
              L 0.34,1
              Q 0.30,1 0.28,0.97
              L 0.08,0.13
              Q 0.07,0.10 0.08,0.08
              Z
            "
            />
          </clipPath>
        </defs>
      </svg>

      <div className="w-full pl-1 pr-4 pt-4 pb-0 border-b border-white/10 relative overflow-visible bg-neutral-950/50">
        <div className="flex items-end gap-0">
          <div className="flex items-end gap-1 overflow-x-auto overflow-y-visible">
            {tabs.map((tab, index) => {
              const isActive = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  draggable
                  onDragStart={(event) => handleDragStart(event, tab.id)}
                  onDragOver={(event) => handleDragOver(event, tab.id)}
                  onDrop={(event) => handleDrop(event, tab.id)}
                  onDragEnd={handleDragEnd}
                  className={`relative flex items-center flex-shrink-0 h-9 min-w-[13rem] px-6 text-sm font-medium transform-gpu transition-all duration-200 ease-out overflow-visible ${
                    isActive
                      ? "z-40 text-neutral-900 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.35)]"
                      : "z-20 text-neutral-200 bg-gradient-to-b from-[#585858] to-[#bdbdbd] shadow-[0_0_0_1px_rgba(69,69,69,1),0_2px_8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]"
                  } ${index > 0 ? "-ml-6" : ""} ${
                    draggingTabId === tab.id ? "opacity-70" : ""
                  }`}
                  style={{
                    clipPath: "url(#tabShape)",
                    WebkitClipPath: "url(#tabShape)",
                  }}
                >
                  <span
                    className="absolute inset-0 rounded-t-xl"
                    style={{ clipPath: "url(#tabShape)" }}
                  />
                  <span className="truncate pr-4 relative z-10">
                    {tab.title}
                  </span>
                  {/* biome-ignore lint/a11y/useSemanticElements: inner close button cannot be a nested button*/}
                  <span
                    role="button"
                    tabIndex={0}
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
              );
            })}
          </div>
          <button
            type="button"
            onClick={addTab}
            disabled={tabs.length >= 6}
            className={`relative flex h-7 w-12 border-[#454545] bg-gradient-to-b from-[#585858] to-[#bdbdbd] items-center justify-center text-lg rounded-lg font-semibold transform-gpu transition-all duration-300 ease-out overflow-visible mb-[6px] ${
              tabs.length >= 6
                ? "cursor-not-allowed text-neutral-600 bg-gradient-to-b from-neutral-700/90 to-neutral-800/90"
                : "cursor-pointer text-neutral-200 bg-gradient-to-b from-[#585858] to-[#bdbdbd] hover:from-neutral-500/90 hover:to-neutral-600/90"
            } z-30 ml-3 shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]`}
            style={{
              clipPath: "url(#plusButtonShape)",
              WebkitClipPath: "url(#plusButtonShape)",
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
            <Tab tabData={tab} onUpdateTab={updateTab} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Landing;
