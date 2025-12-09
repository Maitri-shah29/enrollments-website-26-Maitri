"use client";
import Image from "next/image";
import type React from "react";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";

interface DesignNavbarProps {
  selected: string;
  onSelect: (panel: string) => void;
  roundUser?: RoundUserExtended | null;
  roundHidden?: boolean;
}

const DesignNavbar: React.FC<DesignNavbarProps> = ({
  selected,
  onSelect,
  roundUser,
  roundHidden = false,
}) => {
  const allItems = [
    "Home",
    "About",
    "Instructions",
    "AOIs",
    "Questions",
    "Interview",
  ];

  const items = allItems.filter(
    (item) => !(roundHidden && item.toLowerCase() === "questions"),
  );

  const isDisabled = !roundUser;

  const handleItemClick = (item: string) => {
    if (isDisabled && item !== "Home") {
      return;
    }
    onSelect(item);
  };

  return (
    <div className="flex items-center justify-center min-h-16 z-20 font-coolvetica">
      <div className="flex gap-10">
        {items.map((item) => {
          const isItemDisabled = isDisabled && item !== "Home";

          return (
            <button
              key={item}
              type="button"
              onClick={() => handleItemClick(item)}
              disabled={isItemDisabled}
              className={`relative text-white w-[120px] h-[40px] flex items-center justify-center ${
                isItemDisabled
                  ? "opacity-40 cursor-not-allowed"
                  : "cursor-pointer"
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
