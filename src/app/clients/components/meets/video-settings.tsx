"use client";

import { useRef, useEffect } from "react";
import { ChevronDown, FlipHorizontal } from "lucide-react";

interface VideoSettingsProps {
  isMirrorCamera: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleMirror: () => void;
  isCameraOff: boolean;
}

export default function VideoSettings({
  isMirrorCamera,
  isOpen,
  onToggleOpen,
  onToggleMirror,
  isCameraOff,
}: VideoSettingsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onToggleOpen();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggleOpen]);

  if (isCameraOff) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={onToggleOpen}
        className="p-1.5 hover:bg-white/10 rounded transition-colors"
        title="Video settings"
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-[#1a1a1a] border border-white/20 rounded-lg shadow-xl p-2 w-52 z-50">
          <button
            onClick={onToggleMirror}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded text-sm transition-colors"
          >
            <FlipHorizontal className="w-4 h-4" />
            <span>Mirror camera</span>
            <div className="ml-auto">
              <div
                className={`w-9 h-5 rounded-full transition-colors ${
                  isMirrorCamera ? "bg-blue-600" : "bg-white/20"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${
                    isMirrorCamera ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
