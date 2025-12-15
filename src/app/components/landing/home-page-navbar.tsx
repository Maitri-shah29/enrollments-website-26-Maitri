"use client";

import React from "react";

import { BOOKMARK_LABELS, INTERNAL_KEYWORDS } from "./tab-constants";

export interface HomePageNavbarProps {
  onNavigate: (keyword: string) => void;
}

const HomePageNavbar: React.FC<HomePageNavbarProps> = ({ onNavigate }) => {
  const items = Array.from(INTERNAL_KEYWORDS);

  return (
    <nav className="w-full bg-[#555] text-white py-2">
      <ul className="flex items-center justify-center pl-8 gap-6 text-sm font-semibold">
        {items.map((item, index) => (
          <React.Fragment key={item}>
            <li>
              <button
                type="button"
                onClick={() => onNavigate(item)}
                className="hover:text-gray-300 transition-colors"
              >
                {BOOKMARK_LABELS[item] || item}
              </button>
            </li>

            {index < items.length - 1 && (
              <span className="h-4 w-px bg-gray-300 opacity-40" />
            )}
          </React.Fragment>
        ))}
      </ul>
    </nav>
  );
};

export default HomePageNavbar;
