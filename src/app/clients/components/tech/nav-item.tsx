"use client";
import Image from "next/image";
import React from "react";
import TechButton from "./button";

type Props = {
  label: string;
  iconSrc: string;
  isActive: boolean;
  hasBottomBorder?: boolean;
  onClick: () => void;
};

export default function NavItem({
  label,
  iconSrc,
  isActive,
  hasBottomBorder,
  onClick,
}: Props) {
  return (
    <TechButton
      type="button"
      onClick={onClick}
      className={`border-t-2 ${hasBottomBorder ? "border-b-2" : ""} border-[#993C7A] h-10 text-sm flex items-center cursor-pointer gap-2 px-2 transition-all duration-150 w-full text-left ${
        isActive
          ? "bg-[#993C7A]/20 text-white"
          : "text-[#993C7A] hover:bg-[#993C7A]/10"
      }`}
    >
      <Image src={iconSrc} alt={`${label} icon`} width={20} height={20} />
      {label}
    </TechButton>
  );
}
