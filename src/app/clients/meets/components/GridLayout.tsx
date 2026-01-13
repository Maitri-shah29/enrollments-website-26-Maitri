"use client";

import { Ghost, Hand, MicOff } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Participant } from "../types";
import { getSpeakerHighlightClasses } from "../utils";
import ParticipantVideo from "./ParticipantVideo";

interface GridLayoutProps {
  localStream: MediaStream | null;
  isCameraOff: boolean;
  isMuted: boolean;
  isHandRaised: boolean;
  isGhost: boolean;
  isScreenSharing?: boolean;
  participants: Map<string, Participant>;
  userEmail: string;
  isMirrorCamera: boolean;
  activeSpeakerId: string | null;
  activeScreenShareId?: string | null;
  currentUserId: string;
  audioOutputDeviceId?: string;
  isAdmin?: boolean;
  selectedParticipantId?: string | null;
  onParticipantClick?: (userId: string) => void;
  getDisplayName: (userId: string) => string;
}

export default function GridLayout({
  localStream,
  isCameraOff,
  isMuted,
  isHandRaised,
  isGhost,
  isScreenSharing = false,
  participants,
  userEmail,
  isMirrorCamera,
  activeSpeakerId,
  activeScreenShareId = null,
  currentUserId,
  audioOutputDeviceId,
  isAdmin = false,
  selectedParticipantId,
  onParticipantClick,
  getDisplayName,
}: GridLayoutProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const isLocalActiveSpeaker = activeSpeakerId === currentUserId;

  useEffect(() => {
    const video = localVideoRef.current;
    if (video && localStream) {
      video.srcObject = localStream;
      video.play().catch((err) => {
        if (err.name !== "AbortError") {
          console.error("[Meets] Grid local video play error:", err);
        }
      });
    }
  }, [localStream]);

  const participantsList = Array.from(participants.values());
  const totalParticipants = participantsList.length + 1;

  const getSpeakerPriority = (participant: Participant, index: number) => {
    let score = participantsList.length - index;
    if (participant.userId === activeSpeakerId) score += 200;
    if (participant.isHandRaised) score += 80;
    if (participant.screenShareStream || participant.userId === activeScreenShareId) {
      score += 120;
    }
    if (!participant.videoStream || participant.isCameraOff) score -= 20;
    if (participant.isMuted) score -= 10;
    return score;
  };

  const sortedParticipants = participantsList
    .map((participant, index) => ({
      participant,
      index,
      score: getSpeakerPriority(participant, index),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ participant }) => participant);

  const isLocalPinned =
    isLocalActiveSpeaker || isHandRaised || isScreenSharing;

  const getGridColumns = (count: number) => {
    if (count <= 3) return Math.max(count, 1);
    return Math.ceil(Math.sqrt(count));
  };

  const getGridSizing = (count: number) => {
    if (count <= 4) return { minHeight: 220, gap: "gap-3", padding: "p-2" };
    if (count <= 9) return { minHeight: 190, gap: "gap-3", padding: "p-2" };
    if (count <= 16) return { minHeight: 170, gap: "gap-2", padding: "p-2" };
    if (count <= 25) return { minHeight: 150, gap: "gap-2", padding: "p-2" };
    if (count <= 36) return { minHeight: 130, gap: "gap-1.5", padding: "p-1.5" };
    return { minHeight: 120, gap: "gap-1.5", padding: "p-1.5" };
  };

  const topRowCount = Math.min(4, totalParticipants);
  const topColumns = getGridColumns(topRowCount);
  const gridColumns = getGridColumns(totalParticipants);
  const { minHeight, gap, padding } = getGridSizing(totalParticipants);

  return (
    <div className={`flex-1 flex flex-col overflow-auto ${padding} ${gap}`}>
      <div
        className={`grid ${gap}`}
        style={{
          gridTemplateColumns: `repeat(${topColumns}, minmax(0, 1fr))`,
          gridAutoRows: `minmax(${minHeight + 20}px, 1fr)`,
        }}
      >
        <div
          className={`relative bg-[#111] border border-white/10 rounded-lg overflow-hidden transition-all duration-200 ${getSpeakerHighlightClasses(
            isLocalActiveSpeaker
          )} ${isLocalPinned ? "ring-1 ring-blue-400/40" : ""}`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${
              isCameraOff ? "hidden" : ""
            } ${isMirrorCamera ? "scale-x-[-1]" : ""}`}
          />
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#252525]">
              <div className="w-16 h-16 rounded-full bg-[#333] border border-white/10 flex items-center justify-center text-xl">
                {userEmail[0]?.toUpperCase() || "?"}
              </div>
            </div>
          )}
          {isGhost && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2">
                <Ghost className="w-16 h-16 text-blue-300 drop-shadow-[0_0_22px_rgba(59,130,246,0.5)]" />
                <span className="text-xs text-blue-200/90 bg-black/60 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  Ghost
                </span>
              </div>
            </div>
          )}
          {isHandRaised && (
            <div
              className="absolute top-2 left-2 p-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300"
              title="Hand raised"
            >
              <Hand className="w-4 h-4" />
            </div>
          )}
          <div
            className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 border border-white/5 rounded text-sm flex items-center gap-2"
            style={{ fontWeight: 500 }}
          >
            You {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
          </div>
        </div>

        {sortedParticipants.slice(0, topRowCount - 1).map((participant) => (
          <ParticipantVideo
            key={participant.userId}
            participant={participant}
            displayName={getDisplayName(participant.userId)}
            isActiveSpeaker={activeSpeakerId === participant.userId}
            audioOutputDeviceId={audioOutputDeviceId}
            isAdmin={isAdmin}
            isSelected={selectedParticipantId === participant.userId}
            onAdminClick={onParticipantClick}
          />
        ))}
      </div>

      {sortedParticipants.length > topRowCount - 1 && (
        <div
          className={`grid ${gap}`}
          style={{
            gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
            gridAutoRows: `minmax(${minHeight}px, 1fr)`,
          }}
        >
          {sortedParticipants.slice(topRowCount - 1).map((participant) => (
            <ParticipantVideo
              key={participant.userId}
              participant={participant}
              displayName={getDisplayName(participant.userId)}
              isActiveSpeaker={activeSpeakerId === participant.userId}
              audioOutputDeviceId={audioOutputDeviceId}
              isAdmin={isAdmin}
              isSelected={selectedParticipantId === participant.userId}
              onAdminClick={onParticipantClick}
              className="opacity-85"
            />
          ))}
        </div>
      )}
    </div>
  );
}
