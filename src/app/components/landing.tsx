"use client";
import { useState } from "react";
import Tab, { type TabData } from "./landing/tab";

// Main Landing Component
const Landing: React.FC = () => {
  const [tabs, setTabs] = useState<TabData[]>([
    {
      id: 1,
      title: "Home",
      showForms: false,
      showCc: false,
      showManagement: false,
      showTech: false,
      history: [],
      pointer: -1,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<number>(1);

  const addTab = () => {
    if (tabs.length >= 6) return;
    const newId = Date.now();
    const newTab: TabData = {
      id: newId,
      title: "New Tab",
      showForms: false,
      showCc: false,
      showManagement: false,
      showTech: false,
      history: [],
      pointer: -1,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (id: number) => {
    if (tabs.length === 1) {
      // Reset the only tab
      setTabs([
        {
          id: tabs[0].id,
          title: "Home",
          showForms: false,
          showCc: false,
          showManagement: false,
          showTech: false,
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

  return (
    <div className="bg-blue-800 w-full h-full rounded-xl flex flex-col overflow-hidden">
      {/* Window Controls */}
      <div className="bg-gray-500 h-8 rounded-t-xl w-full flex items-center px-2 gap-2">
        <div className="bg-red-400 w-4 h-4 rounded-full"></div>
        <div className="bg-yellow-400 w-4 h-4 rounded-full"></div>
        <div className="bg-green-500 w-4 h-4 rounded-full"></div>
      </div>

      {/* Tab Bar */}
      <div className="w-full bg-blue-300 h-10 flex items-end px-2 gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTabId(tab.id)}
            className={`w-60 h-9 rounded-t-xl flex items-center px-4 whitespace-nowrap text-white text-sm cursor-pointer transition-all ${
              activeTabId === tab.id
                ? "bg-blue-800"
                : "bg-blue-400 hover:bg-blue-500"
            }`}
          >
            {tab.title}
            {/* biome-ignore lint/a11y/useSemanticElements: inner close button
            cannot be a nested button*/}
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
              className="hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center ml-auto"
            >
              x
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={addTab}
          disabled={tabs.length >= 6}
          className={`w-7 mb-1 h-7 rounded-full aspect-square flex items-center justify-center text-white text-sm cursor-pointer ${
            tabs.length >= 6
              ? "bg-blue-200 cursor-not-allowed"
              : "bg-blue-400 hover:bg-blue-500"
          }`}
        >
          +
        </button>
      </div>

      {/* All tabs are rendered at once but only active tab is displayed */}
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
