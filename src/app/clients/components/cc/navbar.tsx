"use client";
import Image from "next/image";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import { DOMAIN_CAP } from "@/lib/constants";

type CCNavBarProps = {
  selected: string;
  onSelect: (selected: string) => void;
  disabled?: boolean;
  roundHidden?: boolean;
  roundUserCount?: number;
  roundUser?: RoundUserExtended | null;
};

const CCNavBar = ({
  selected,
  onSelect,
  disabled = false,
  roundHidden = false,
  roundUserCount = 0,
  roundUser,
}: CCNavBarProps) => {
  const allButtons: string[] = [
    "About",
    "Instructions",
    "Questions",
    "Contest",
  ];

  const buttons = roundHidden
    ? allButtons.filter((btn) => btn !== "Questions")
    : allButtons;

  const isLimitReached =
    roundUserCount >= DOMAIN_CAP && roundUser?.status === "pending";

  return (
    <div className="flex justify-center items-center w-full">
      <div className="flex justify-center items-center ml-5">
        <Image
          src="/images/ACM-VIT-Logo.svg"
          height={100}
          width={100}
          alt="ACM-logo"
        />
        <Image
          src="/images/ACM-logo-text.svg"
          height={40}
          width={100}
          alt="ACM-logo"
        />
      </div>
      <div className="flex w-[75%] mx-auto transform skew-x-30 h-fit justify-end items-end">
        <div
          className={`flex items-center justify-center bg-[#C9EB3E] py-0.5 gap-3 w-full px-0.5 font-ShareTechMono ${
            disabled || isLimitReached ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {buttons.map((button, index) => (
            <button
              key={button}
              type="button"
              onClick={() => {
                if (disabled || isLimitReached) return;
                onSelect(button);
              }}
              aria-disabled={disabled || isLimitReached}
              className={`px-3 py-3 border-0 text-lg font-medium flex-1 transition-all duration-180 ease-in ${
                selected === button
                  ? "bg-[#C9EB3E] text-[#16171B]"
                  : "bg-[#16171B] text-[#C9EB3E]"
              } ${disabled || isLimitReached ? "pointer-events-none" : ""}`}
              style={{
                marginRight: index === buttons.length - 1 ? "0" : "-10px",
              }}
            >
              <span
                className="inline-block -skew-x-30"
                style={{ fontFamily: "var(--font-share-tech)" }}
              >
                {button}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CCNavBar;
