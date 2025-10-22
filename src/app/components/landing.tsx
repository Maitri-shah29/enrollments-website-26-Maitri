"use client";
import { useEffect, useState } from "react";
import RefreshButton from "@/app/components/refresh-button";
import FormsClient from "./forms-client";
import ProfileButton from "./profile-button";

interface Tab {
  id: number;
  title: string;
  url: string | null;
}

const Landing: React.FC = () => {
  const [pagesStack, setPagesStack] = useState<Tab[]>([]);
  const [pointer, setPointer] = useState<number>(-1);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, title: "Home", url: null },
  ]);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>("");
  const [showForms, setShowForms] = useState<boolean>(false);

  // Load tabs and activeTab from localStorage

  useEffect(() => {
    const savedTabs = localStorage.getItem("tabs");
    const savedActiveTab = localStorage.getItem("activeTab");
    if (savedTabs) setTabs(JSON.parse(savedTabs));
    if (savedActiveTab) setActiveTab(Number(savedActiveTab));
    const savedPages = localStorage.getItem(`${savedActiveTab}`);
    const pointerr = localStorage.getItem(`${savedActiveTab}-pointer`);
    if (savedPages) {
      const parsedPages = JSON.parse(savedPages);
      setPagesStack(parsedPages);
      if (pointerr) {
        const parsedPointer = JSON.parse(pointerr);
        if (parsedPointer) {
        }
        setPointer(parsedPointer);
        setInputValue(
          parsedPages[
            parsedPointer >= 0 ? parsedPointer : parsedPages.length - 1
          ]?.url.slice(8),
        );
      } else {
        setPointer(parsedPages.length - 1);
        setInputValue(parsedPages[parsedPages.length - 1].url.slice(8));
      }
    }
  }, []);

  // Save tabs and activeTab to localStorage
  useEffect(() => {
    localStorage.setItem("tabs", JSON.stringify(tabs));
    localStorage.setItem("activeTab", activeTab.toString());
    const savedPages = localStorage.getItem(`${activeTab}`);
    const pointerr = localStorage.getItem(`${activeTab}-pointer`);
    if (savedPages) {
      const parsedPages = JSON.parse(savedPages);
      setPagesStack(parsedPages);
      if (pointerr) {
        const parsedPointer = JSON.parse(pointerr);
        setPointer(parsedPointer);
        setInputValue(
          parsedPages[
            parsedPointer >= 0 ? parsedPointer : parsedPages.length - 1
          ]?.url.slice(8),
        );
      } else {
        setPointer(parsedPages.length - 1);
        setInputValue(parsedPages[parsedPages.length - 1].url.slice(8));
      }
    } else {
      setPagesStack([]);
      setPointer(-1);
    }
  }, [tabs, activeTab]);

  const addTab = () => {
    if (tabs.length >= 5) return;
    const newId = Date.now();
    setTabs([...tabs, { id: newId, title: "New Tab", url: null }]);
    setActiveTab(newId);
    setInputValue("");
  };

  const closeTab = (id: number) => {
    localStorage.removeItem(`${activeTab}`);
    if (tabs.length === 1) {
      tabs[0].url = null;
      tabs[0].title = "Home";
      setInputValue("");
      setPagesStack([]);
      setPointer(-1);
      return;
    }
    const remaining = tabs.filter((tab) => tab.id !== id);
    setTabs(remaining);
    if (activeTab === id) {
      const newActive = remaining[remaining.length - 1];
      setActiveTab(newActive.id);
      setInputValue(
        newActive.url ? newActive.url.replace(/^https:\/\//, "") : "",
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value.replace(/^https:\/\//, ""));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      const trimmed = inputValue.trim().toLowerCase();
      if (trimmed === "forms") {
        setShowForms(true);
        return;
      }
      const pageStack = localStorage.getItem(`${activeTab}`);
      if (pageStack) {
        const parsedData = JSON.parse(pageStack);
        parsedData.push({
          id: 69,
          title: "new tab",
          url: `https://${inputValue}`,
        });
        setPagesStack(parsedData);
        setPointer(parsedData.length - 1);
        localStorage.setItem(
          `${activeTab}-pointer`,
          JSON.stringify(parsedData.length - 1),
        );
        localStorage.setItem(`${activeTab}`, JSON.stringify(parsedData));
      } else {
        const parsedData = [];
        parsedData.push({
          id: 69,
          title: "new tab",
          url: `https://${inputValue}`,
        });
        setPagesStack(parsedData);
        setPointer(parsedData.length - 1);
        localStorage.setItem(
          `${activeTab}-pointer`,
          JSON.stringify(parsedData.length - 1),
        );
        localStorage.setItem(`${activeTab}`, JSON.stringify(parsedData));
      }
      const formatted = inputValue.startsWith("https://")
        ? inputValue
        : `https://${inputValue}`; // fixed template literal
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTab ? { ...tab, url: formatted } : tab,
        ),
      );
    }
  };

  const switchTab = (id: number) => {
    setActiveTab(id);
    const tab = tabs.find((t) => t.id === id);
    if (tab) setInputValue(tab.url ? tab.url.replace(/^https:\/\//, "") : "");
  };

  const activeTabData = pagesStack[pointer];

  const goPrevious = () => {
    if (pointer >= 0) {
      localStorage.setItem(`${activeTab}-pointer`, JSON.stringify(pointer - 1));
      if (pagesStack[pointer - 1]?.url) {
        setInputValue(pagesStack[pointer - 1]?.url?.slice(8) ?? "");
      } else {
        setInputValue("");
      }
      setPointer(pointer - 1);
    }
  };

  const goNext = () => {
    if (pointer < pagesStack.length - 1) {
      localStorage.setItem(`${activeTab}-pointer`, JSON.stringify(pointer + 1));
      if (pagesStack[pointer + 1]?.url) {
        setInputValue(pagesStack[pointer + 1]?.url?.slice(8) ?? "");
      } else {
        setInputValue("");
      }
      setPointer(pointer + 1);
    }
  };

  return (
    <div className="bg-blue-800 w-full h-full rounded-xl flex flex-col overflow-hidden">
      <div className="bg-gray-500 h-8 rounded-t-xl w-full flex items-center px-2 gap-2">
        <div className="bg-red-400 w-4 h-4 rounded-full"></div>
        <div className="bg-yellow-400 w-4 h-4 rounded-full"></div>
        <div className="bg-green-500 w-4 h-4 rounded-full"></div>
      </div>

      <div className="w-full bg-blue-300 h-10 flex items-end px-2 gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchTab(tab.id)}
            className={`w-60 h-9 rounded-t-xl flex items-center px-4 whitespace-nowrap text-white text-sm cursor-pointer transition-all ${
              activeTab === tab.id
                ? "bg-blue-800"
                : "bg-blue-400 hover:bg-blue-500"
            }`}
          >
            {tab.title}
            {/*biome-ignore lint/a11y/useSemanticElements: inner close button
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

        {/* Add Tab button */}
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

      <div className="w-full bg-blue-800 h-10 flex items-center py-1 px-10 gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="hover:bg-white/10 rounded-full p-2"
            onClick={goPrevious}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              width="15"
              height="15"
              fill={pointer !== -1 ? "white" : "grey"}
            >
              <title>Previous</title>
              <path d="M512 224H147.3l136.4-136.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L147.3 288H512c17.7 0 32-14.3 32-32s-14.3-32-32-32z" />
            </svg>
          </button>
          <button
            type="button"
            className="hover:bg-white/10 rounded-full p-2"
            onClick={goNext}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              width="15"
              height="15"
              fill={pointer !== pagesStack.length - 1 ? "white" : "grey"}
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
            value={inputValue ?? ""}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="acmvit.in"
          />
        </div>
        <div className="ml-auto mb-1">
          <ProfileButton />
        </div>
      </div>

      <div className="flex-1 w-full overflow-hidden bg-blue-900 flex flex-col items-center justify-center text-white gap-6">
        {activeTabData?.url ? (
          <iframe
            key={activeTabData.url}
            className="w-full h-full rounded-b-xl"
            src={activeTabData.url}
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
                value={inputValue ?? ""}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="acmvit.in"
              />
            </div>

            <div className="flex gap-4 flex-wrap justify-center mt-4">
              <div className="w-40 h-25 bg-white/70 rounded-4xl"></div>
              <div className="w-40 h-25 bg-white/70 rounded-4xl"></div>
              <div className="w-40 h-25 bg-white/70 rounded-4xl"></div>
              <div className="w-40 h-25 bg-white/70 rounded-4xl"></div>
              <div className="w-40 h-25 bg-white/70 rounded-4xl"></div>
            </div>
          </div>
        )}
      </div>

      {showForms && (
        <div className="fixed inset-0 z-50 bg-white">
          <button
            type="button"
            aria-label="Close forms"
            onClick={() => setShowForms(false)}
            className="fixed top-4 right-4 z-[60] rounded-full w-12 h-12 flex items-center justify-center text-white text-2xl font-semibold bg-blue-600 hover:bg-blue-700 shadow"
          >
            ×
          </button>
          <FormsClient />
        </div>
      )}
    </div>
  );
};

export default Landing;
