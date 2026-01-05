"use client";

import React from "react";

import { BOOKMARK_LABELS } from "./tab-constants";

export interface HomePageNavbarProps {
  onNavigate: (keyword: string) => void;
  promotedDomains?: string[];
}

const HomePageNavbar: React.FC<HomePageNavbarProps> = ({
  onNavigate,
  promotedDomains = [],
}) => {
  const promotedSet = new Set(promotedDomains);

  return (
    <nav className="w-full bg-[#555] text-white py-2 overflow-visible">
      <ul className="flex items-center justify-center pl-8 gap-6 text-sm font-semibold overflow-visible">
        {Object.entries(BOOKMARK_LABELS).map(([key, label], index, arr) => (
          <React.Fragment key={key}>
            <li>
              <button
                type="button"
                onClick={() => onNavigate(key)} // ← key used here
                title={promotedSet.has(key) ? "Results available" : undefined}
                className="relative overflow-visible hover:text-gray-300 transition-colors"
              >
                <span className={promotedSet.has(key) ? "promo-text" : ""}>
                  {label}
                </span>
              </button>
            </li>

            {index < arr.length - 1 && (
              <span className="h-4 w-px bg-gray-300 opacity-40" />
            )}
          </React.Fragment>
        ))}
      </ul>
    </nav>
  );
};

export default HomePageNavbar;
