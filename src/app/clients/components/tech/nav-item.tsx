"use client";
import Image from "next/image";
import TechButton from "./button";

type Props = {
  label: string;
  iconSrc: string;
  isActive: boolean;
  hasBottomBorder?: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export default function NavItem({
  label,
  iconSrc,
  isActive,
  hasBottomBorder,
  onClick,
  disabled = false,
}: Props) {
  return (
    <TechButton
      type="button"
      onClick={disabled ? undefined : onClick}
      className={`border-t-2 ${hasBottomBorder ? "border-b-2" : ""} border-[#993C7A] h-10 text-sm flex items-center gap-2 px-2 transition-all duration-150 w-full text-left ${
        disabled
          ? "cursor-not-allowed text-[#993C7A]/40 bg-[#993C7A]/5"
          : isActive
            ? "bg-[#993C7A]/20 text-white cursor-pointer"
            : "text-[#993C7A] hover:bg-[#993C7A]/10 cursor-pointer"
      }`}
      disabled={disabled}
    >
      <Image
        src={iconSrc}
        alt={`${label} icon`}
        width={20}
        height={20}
        className={disabled ? "opacity-40" : ""}
      />
      {label}
    </TechButton>
  );
}
