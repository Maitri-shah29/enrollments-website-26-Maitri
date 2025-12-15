"use client";

import Image from "next/image";
import type React from "react";

import ProfileButton from "../profile-button";
import RefreshButton from "../refresh-button";

export interface TabHeaderProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
  onRefresh: () => void;

  navInput: string;
  navInputRef: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;

  onNavChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNavKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onNavCommit: () => void;

  history: string[];
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onSelectHistoryItem: (item: string) => void;
  onRemoveHistoryItem: (item: string) => void;
}

const TabHeader: React.FC<TabHeaderProps> = ({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onHome,
  onRefresh,
  navInput,
  navInputRef,
  placeholder,
  onNavChange,
  onNavKeyDown,
  onNavCommit,
  history,
  isFocused,
  onFocus,
  onBlur,
  onSelectHistoryItem,
  onRemoveHistoryItem,
}) => {
  const navIconButtonBase =
    "flex items-center justify-center text-neutral-500 rounded-md border border-transparent transition duration-150 hover:text-neutral-900 hover:bg-white/70 hover:border-white/80 active:bg-white active:border-white focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent";
  const navIconButton = `${navIconButtonBase} px-2.5 py-1`;
  const navIconButtonCompact = `${navIconButtonBase} px-2 py-1`;
  const navIconButtonDisabled =
    "opacity-40 cursor-not-allowed pointer-events-none hover:text-neutral-500";

  const filteredHistory = history
    .filter((item) => item.toLowerCase().includes(navInput.toLowerCase()))
    .slice(0, 12);

  return (
    <div className="w-full bg-[#ffffff]">
      <div className="flex items-center gap-2.5 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={`${navIconButton} ${!canGoBack ? navIconButtonDisabled : ""}`}
            onClick={onBack}
            disabled={!canGoBack}
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
            className={`${navIconButton} ${!canGoForward ? navIconButtonDisabled : ""}`}
            onClick={onForward}
            disabled={!canGoForward}
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
            onRefresh={onRefresh}
          />
          <button
            type="button"
            className={navIconButton}
            onClick={onHome}
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
              onChange={onNavChange}
              onKeyDown={onNavKeyDown}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder={placeholder}
            />

            {isFocused && history.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#252525] rounded-lg shadow-xl border border-white/10 overflow-hidden z-[100]">
                {filteredHistory.map((item) => (
                  <div
                    key={item}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 transition-colors group"
                  >
                    <button
                      type="button"
                      className="flex-1 text-left text-white flex items-center gap-2"
                      onClick={() => onSelectHistoryItem(item)}
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
                        onRemoveHistoryItem(item);
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
              onClick={onNavCommit}
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
  );
};

export default TabHeader;
