"use client";

import Lottie from "lottie-react";
import animationData from "@/../public/animations/NormalLoader2.json";

type LoaderProps = {
  size?: number | string;
  className?: string;
  loop?: boolean;
};

export function Loader({ size = 460, className, loop = true }: LoaderProps) {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay
      style={{ width: size, height: size, zIndex: 1000 }}
      className={className}
      aria-label="Loading"
    />
  );
}
