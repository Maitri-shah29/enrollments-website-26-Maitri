"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Settings, FlipHorizontal, Mic, Volume2 } from "lucide-react";

interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

interface VideoSettingsProps {
  isMirrorCamera: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleMirror: () => void;
  isCameraOff: boolean;
  selectedAudioInputDeviceId?: string;
  selectedAudioOutputDeviceId?: string;
  onAudioInputDeviceChange?: (deviceId: string) => void;
  onAudioOutputDeviceChange?: (deviceId: string) => void;
}

export default function VideoSettings({
  isMirrorCamera,
  isOpen,
  onToggleOpen,
  onToggleMirror,
  isCameraOff,
  selectedAudioInputDeviceId,
  selectedAudioOutputDeviceId,
  onAudioInputDeviceChange,
  onAudioOutputDeviceChange,
}: VideoSettingsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [audioInputDevices, setAudioInputDevices] = useState<
    MediaDeviceOption[]
  >([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<
    MediaDeviceOption[]
  >([]);

  // Fetch available devices
  const fetchDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const audioInputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${i + 1}`,
        }));

      const audioOutputs = devices
        .filter((d) => d.kind === "audiooutput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${i + 1}`,
        }));

      setAudioInputDevices(audioInputs);
      setAudioOutputDevices(audioOutputs);
    } catch (err) {
      console.error("[VideoSettings] Failed to enumerate devices:", err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }
  }, [isOpen, fetchDevices]);

  useEffect(() => {
    navigator.mediaDevices.addEventListener("devicechange", fetchDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", fetchDevices);
    };
  }, [fetchDevices]);

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

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={onToggleOpen}
        className="p-2 hover:bg-white/10 rounded-md transition-colors bg-white/5 border border-white/10"
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-[#1a1a1a] border border-white/20 rounded-lg shadow-xl p-2 w-72 z-50">
          {/* Mirror Camera Toggle */}
          {!isCameraOff && (
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
          )}

          {!isCameraOff && <div className="border-t border-white/10 my-2" />}

          {/* Microphone Selection */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
              <Mic className="w-3.5 h-3.5" />
              <span>Microphone</span>
            </div>
            <select
              value={selectedAudioInputDeviceId || ""}
              onChange={(e) => onAudioInputDeviceChange?.(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-white/30 cursor-pointer"
            >
              {audioInputDevices.length === 0 ? (
                <option value="">No microphones found</option>
              ) : (
                audioInputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Speaker Selection */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Speaker</span>
            </div>
            <select
              value={selectedAudioOutputDeviceId || ""}
              onChange={(e) => onAudioOutputDeviceChange?.(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-white/30 cursor-pointer"
            >
              {audioOutputDevices.length === 0 ? (
                <option value="">No speakers found</option>
              ) : (
                audioOutputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
