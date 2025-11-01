"use client";
import type React from "react";

interface DesignNavbarProps {
  selected: string;
  onSelect: (panel: string) => void;
}

const DesignNavbar: React.FC<DesignNavbarProps> = ({ selected, onSelect }) => {
  const items = [
    "Home",
    "About",
    "Instructions",
    "AOIs",
    "Questions",
    "Interview",
  ];

  return (
    <div className="flex items-center justify-between h-16 border-b border-black px-8">
      <div className="flex space-x-6">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={`text-black ${
              selected === item ? "font-bold underline" : ""
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DesignNavbar;
