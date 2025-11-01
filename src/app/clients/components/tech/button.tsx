"use client";
import type React from "react";

type TechButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "sidebar" | "submit";
};

const base =
  "transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#993C7A] focus-visible:ring-offset-[#08111D] disabled:cursor-not-allowed";

export default function TechButton({
  className = "",
  variant = "default",
  type = "button",
  children,
  ...props
}: TechButtonProps) {
  return (
    <button type={type} className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
}
