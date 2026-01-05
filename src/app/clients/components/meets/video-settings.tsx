"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Settings,
  FlipHorizontal,
  Mic,
  Volume2,
  ChevronDown,
  Check,
} from "lucide-react";

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

// Custom dropdown component
function DeviceDropdown({
  devices,
  selectedDeviceId,
  onSelect,
  placeholder,
}: {
  devices: MediaDeviceOption[];
  selectedDeviceId?: string;
  onSelect: (deviceId: string) => void;
  placeholder: string;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDevice = devices.find((d) => d.deviceId === selectedDeviceId);
  const displayLabel =
    selectedDevice?.label ||
    (devices.length > 0 ? devices[0].label : placeholder);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center justify-between gap-2 bg-[#222] hover:bg-[#2a2a2a] border border-white/10 rounded-md px-3 py-2 text-sm text-left transition-colors"
      >
        <span className="truncate text-white/90">{displayLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-white/50 shrink-0 transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#222] border border-white/10 rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
          {devices.length === 0 ? (
            <div className="px-3 py-2 text-sm text-white/50">{placeholder}</div>
          ) : (
            devices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => {
                  onSelect(device.deviceId);
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
              >
                <span className="truncate flex-1 text-white/90">
                  {device.label}
                </span>
                {(device.deviceId === selectedDeviceId ||
                  (!selectedDeviceId && device === devices[0])) && (
                  <Check className="w-4 h-4 text-blue-500 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
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
    <div ref={containerRef} className="relative h-full">
      <button
        onClick={onToggleOpen}
        className="h-full px-2 hover:bg-white/10 rounded-md transition-colors bg-white/5 border border-white/10 flex items-center"
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-[#1a1a1a] border border-white/20 rounded-lg shadow-xl p-2 w-96 z-50">
          {/* Mirror Camera Toggle */}
          <button
            onClick={onToggleMirror}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded text-sm transition-colors"
          >
            <FlipHorizontal className="w-4 h-4" />
            <span>Mirror camera</span>
            <div className="ml-auto">
              <div
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  isMirrorCamera ? "bg-blue-600" : "bg-white/20"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    isMirrorCamera ? "left-5" : "left-1"
                  }`}
                />
              </div>
            </div>
          </button>

          <div className="border-t border-white/10 my-2" />

          {/* Microphone Selection */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
              <Mic className="w-3.5 h-3.5" />
              <span>Microphone</span>
            </div>
            <DeviceDropdown
              devices={audioInputDevices}
              selectedDeviceId={selectedAudioInputDeviceId}
              onSelect={(deviceId) => onAudioInputDeviceChange?.(deviceId)}
              placeholder="No microphones found"
            />
          </div>

          {/* Speaker Selection */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Speaker</span>
            </div>
            <DeviceDropdown
              devices={audioOutputDevices}
              selectedDeviceId={selectedAudioOutputDeviceId}
              onSelect={(deviceId) => onAudioOutputDeviceChange?.(deviceId)}
              placeholder="No speakers found"
            />
          </div>
        </div>
      )}
    </div>
  );
}
