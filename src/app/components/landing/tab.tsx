import { useState } from "react";
import Management from "@/app/clients/management-client";
import FormsClient from "../forms-client";
import TechWebsite from "../tech-website";
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
  showForms: boolean;
  showManagement: boolean;
  showTech: boolean;
  history: PageHistory[];
  pointer: number;
}

interface TabProps {
  tabData: TabData;
  onUpdateTab: (updatedTab: TabData) => void;
}

const Tab: React.FC<TabProps> = ({ tabData, onUpdateTab }) => {
  const [inputValue, setInputValue] = useState<string>(() => {
    if (tabData.pointer >= 0 && tabData.history[tabData.pointer]) {
      return tabData.history[tabData.pointer].url.slice(8);
    }
    return "";
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value.replace(/^https:\/\//, ""));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      const trimmed = inputValue.trim().toLowerCase();

      if (trimmed === "forms") {
        onUpdateTab({
          ...tabData,
          showForms: true,
          showManagement: false,
          showTech: false,
          title: "Forms",
        });
        return;
      } else if (trimmed === "management") {
        onUpdateTab({
          ...tabData,
          showForms: false,
          showManagement: true,
          showTech: false,
          title: "Management",
        });
        return;
      } else if (trimmed === "tech") {
        onUpdateTab({
          ...tabData,
          showForms: false,
          showManagement: false,
          showTech: true,
          title: "Tech",
        });
        return;
      }

      const formatted = `https://${inputValue}`;
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
        showForms: false,
        showManagement: false,
        showTech: false,
      });
    }
  };

  const goPrevious = () => {
    if (tabData.pointer > 0) {
      const newPointer = tabData.pointer - 1;
      onUpdateTab({
        ...tabData,
        pointer: newPointer,
      });
      setInputValue(tabData.history[newPointer].url.slice(8));
    }
  };

  const goNext = () => {
    if (tabData.pointer < tabData.history.length - 1) {
      const newPointer = tabData.pointer + 1;
      onUpdateTab({
        ...tabData,
        pointer: newPointer,
      });
      setInputValue(tabData.history[newPointer].url.slice(8));
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
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="acmvit.in"
          />
        </div>

        <div className="ml-auto mb-1">
          <ProfileButton />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full overflow-hidden bg-blue-900 flex flex-col items-center justify-center text-white gap-6 relative">
        {tabData.showForms ? (
          <div className="w-full h-full bg-white rounded-b-xl overflow-auto relative">
            <div className="h-full flex items-center justify-center">
              <FormsClient />
            </div>
          </div>
        ) : tabData.showManagement ? (
          <div className="w-full h-full bg-white rounded-b-xl overflow-auto relative">
            <div className="h-full flex items-center justify-center">
              <Management />
            </div>
          </div>
        ) : tabData.showTech ? (
          <div className="w-full h-full bg-white rounded-b-xl overflow-auto relative">
            <div className="h-full flex items-center justify-center">
              <TechWebsite />
            </div>
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
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="acmvit.in"
              />
            </div>

            <div className="flex gap-4 flex-wrap justify-center mt-4">
              <div className="w-40 h-25 bg-white/70 rounded-xl"></div>
              <div className="w-40 h-25 bg-white/70 rounded-xl"></div>
              <div className="w-40 h-25 bg-white/70 rounded-xl"></div>
              <div className="w-40 h-25 bg-white/70 rounded-xl"></div>
              <div className="w-40 h-25 bg-white/70 rounded-xl"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tab;
