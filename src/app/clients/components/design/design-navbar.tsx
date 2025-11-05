"use client";
import Image from "next/image";
import type React from "react";

interface DesignNavbarProps {
  selected: string;
  onSelect: (panel: string) => void;
  disableQuestions?: boolean;
}

const DesignNavbar: React.FC<DesignNavbarProps> = ({
  selected,
  onSelect,
  disableQuestions = false,
}) => {
  const items = [
    "Home",
    "About",
    "Instructions",
    "AOIs",
    "Questions",
    "Interview",
  ];

  const handleItemClick = (item: string) => {
    if (item === "Questions" && disableQuestions) {
      return;
    }
    onSelect(item);
  };

  return (
    <div className="flex items-center justify-center min-h-16 z-20 font-georgia">
      <div className="flex gap-10">
        {items.map((item) => {
          const isDisabled = item === "Questions" && disableQuestions;

          return (
            <button
              key={item}
              type="button"
              onClick={() => handleItemClick(item)}
              disabled={isDisabled}
              className={`relative text-white w-[120px] h-[40px] flex items-center justify-center ${
                isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {selected === item && (
                <Image
                  src="/images/design/circle.svg"
                  alt=""
                  width={120}
                  height={120}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none"
                />
              )}

              <span className={selected === item ? "font-bold" : ""}>
                {item}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DesignNavbar;
