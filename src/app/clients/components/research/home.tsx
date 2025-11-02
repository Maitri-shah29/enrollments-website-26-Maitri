"use client";

import type React from "react";

// Static faint lines positioned from Figma output, scaled responsively
function StaticFaintLines() {
  // Base artboard size from Figma
  const BASE_W = 1366;
  const BASE_H = 944;

  type Line = { w: number; left: number; top: number; rot: number };
  const lines: Line[] = [
    { w: 949.58, left: 368.89, top: 392.29, rot: 18.71 },
    { w: 936.34, left: 416.88, top: 307.24, rot: 24.59 },
    { w: 828.01, left: 368.89, top: 392.29, rot: 10.46 },
    { w: 948.11, left: 324.0, top: 781.96, rot: -5.15 },
    { w: 828.74, left: 368.89, top: 696.9, rot: -10.73 },
    { w: 960.33, left: 368.89, top: 696.9, rot: 15.78 },
    { w: 1027.32, left: 368.89, top: 392.29, rot: 28.9 },
    { w: 950.31, left: 324.0, top: 781.96, rot: 6.45 },
    { w: 948.19, left: 348.77, top: 928.33, rot: -14.13 },
    { w: 1043.89, left: 368.89, top: 696.9, rot: -19.73 },
    { w: 864.67, left: 416.88, top: 142.0, rot: 27.6 },
    // extras around edges for richness
    { w: 822.02, left: 321.5, top: 949.01, rot: -90 },
  ];

  return (
    <>
      {lines.map((l, idx) => (
        <div
          key={idx}
          className="absolute h-px bg-white/10"
          style={{
            width: `${(l.w / BASE_W) * 100}%`,
            left: `${(l.left / BASE_W) * 100}%`,
            top: `${(l.top / BASE_H) * 100}%`,
            transformOrigin: "top left",
            transform: `rotate(${l.rot}deg)`,
          }}
        />
      ))}
    </>
  );
}

// Decorative clusters (from Figma snippet) placed around the canvas background

export default function Home() {
  return (
    <div
      className="relative w-full h-full bg-[#0A0A0F] overflow-hidden"
      style={
        {
          // Reserve space for a future sidebar; adjust in one place later
          // Example: 16rem (256px). Consumers can override via CSS if needed.
          ["--rs-sidebar" as any]: "16rem",
        } as React.CSSProperties
      }
    >
      {/* Faint lines taken from Figma spec */}
      <StaticFaintLines />

      {/* Centered headline inside content column (excluding sidebar area) */}
      <div
        className="absolute inset-0"
        style={{
          display: "grid",
          gridTemplateColumns: "var(--rs-sidebar) 1fr",
        }}
      >
        <div className="col-start-2 row-start-1 flex items-center justify-center">
          <h1
            style={{
              color: "#C8B7FF",
              textAlign: "center",
              fontFamily:
                '"SF Pro", system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"',
              fontSize: "6.25rem", // 100px
              fontStyle: "normal",
              fontWeight: 590,
              lineHeight: "normal",
            }}
            className="px-4 select-none"
          >
            Welcome to
            <br />
            ACM VIT
            <br />
            Research
          </h1>
        </div>
      </div>
    </div>
  );
}
