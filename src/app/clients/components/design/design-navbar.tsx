"use client";
import Image from "next/image";
import type React from "react";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import { DOMAIN_CAP } from "@/lib/constants";

interface DesignNavbarProps {
  selected: string;
  onSelect: (panel: string) => void;
  roundUser?: RoundUserExtended | null;
  roundHidden?: boolean;
  roundUserCount?: number;
}

const DesignNavbar: React.FC<DesignNavbarProps> = ({
  selected,
  onSelect,
  roundUser,
  roundHidden = false,
  roundUserCount = 0,
}) => {
  const allItems = ["Home", "About", "Instructions", "AOIs", "Questions"];

  const items = allItems.filter(
    (item) => !(roundHidden && item.toLowerCase() === "questions"),
  );

  const isDisabled = !roundUser;
  const isLimitReached =
    roundUserCount >= DOMAIN_CAP && roundUser?.status === "pending";

  const handleItemClick = (item: string) => {
    if (isLimitReached && item !== "Home") {
      return;
    }
    if (isDisabled && item !== "Home") {
      return;
    }
    onSelect(item);
  };

  return (
    <div className="flex items-center justify-center min-h-20 z-20 font-coolvetica">
      <div className="flex gap-10">
        {items.map((item) => {
          const isItemDisabled =
            (isDisabled || isLimitReached) && item !== "Home";

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
                  className="absolute scale-[105%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none"
                />
              )}

              <span className={selected === item ? "" : ""}>{item}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DesignNavbar;
