"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Socket } from "socket.io-client";
import type { RoomInfo } from "@/lib/sfu-types";
import AdminActionsSidebar from "./AdminActionsSidebar";
import AdminTipsOverlay from "./AdminTipsOverlay";
import ChatOverlay from "./ChatOverlay";
import ChatPanel from "./ChatPanel";
import ControlsBar from "./ControlsBar";
import GridLayout from "./GridLayout";
import JoinScreen from "./JoinScreen";
import ParticipantsPanel from "./ParticipantsPanel";
import PresentationLayout from "./PresentationLayout";
import ReactionOverlay from "./ReactionOverlay";
import type {
  ChatMessage,
  ConnectionState,
  MeetingSlotOption,
  Participant,
  ReactionEvent,
  ReactionOption,
} from "../types";

interface MeetsMainContentProps {
  isJoined: boolean;
  connectionState: ConnectionState;
  isLoading: boolean;
  roomId: string;
  setRoomId: Dispatch<SetStateAction<string>>;
  joinRoom: () => void;
  joinRoomById: (roomId: string) => void;
  userEmail: string;
  isAdmin: boolean;
  showPermissionHint: boolean;
  availableRooms: RoomInfo[];
  roomsStatus: "idle" | "loading" | "error";
  refreshRooms: () => void;
  userSlotOptions: MeetingSlotOption[];
  selectedSlotId: string | null;
  handleSlotSelect: (slotId: string) => void;
  displayNameInput: string;
  setDisplayNameInput: Dispatch<SetStateAction<string>>;
  ghostEnabled: boolean;
  setIsGhostMode: Dispatch<SetStateAction<boolean>>;
  userMeetingStatus:
  | "loading"
  | "has-slot"
  | "needs-booking"
  | "not-enrolled";
  presentationStream: MediaStream | null;
  presenterName: string;
  localStream: MediaStream | null;
  isCameraOff: boolean;
  isMuted: boolean;
  isHandRaised: boolean;
  participants: Map<string, Participant>;
  isMirrorCamera: boolean;
  activeSpeakerId: string | null;
  currentUserId: string;
  audioOutputDeviceId?: string;
  activeScreenShareId: string | null;
  isScreenSharing: boolean;
  selectedParticipantForActions: string | null;
  setSelectedParticipantForActions: Dispatch<SetStateAction<string | null>>;
  isChatOpen: boolean;
  unreadCount: number;
  reactionOptions: ReactionOption[];
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  toggleChat: () => void;
  toggleHandRaised: () => void;
  sendReaction: (reaction: ReactionOption) => void;
  leaveRoom: () => void;
  isParticipantsOpen: boolean;
  setIsParticipantsOpen: Dispatch<SetStateAction<boolean>>;
  pendingUsers: Map<string, string>;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: Dispatch<SetStateAction<string>>;
  sendChat: (content: string) => void;
  chatOverlayMessages: ChatMessage[];
  setChatOverlayMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  socket: Socket | null;
  setPendingUsers: Dispatch<SetStateAction<Map<string, string>>>;
  showAdminTips: boolean;
  setShowAdminTips: Dispatch<SetStateAction<boolean>>;
  setHasSeenTips: Dispatch<SetStateAction<boolean>>;
  resolveDisplayName: (userId: string) => string;
  reactions: ReactionEvent[];
  isRoomLocked: boolean;
  onToggleLock: () => void;
}

export default function MeetsMainContent({
  isJoined,
  connectionState,
  isLoading,
  roomId,
  setRoomId,
  joinRoom,
  joinRoomById,
  userEmail,
  isAdmin,
  showPermissionHint,
  availableRooms,
  roomsStatus,
  refreshRooms,
  userSlotOptions,
  selectedSlotId,
  handleSlotSelect,
  displayNameInput,
  setDisplayNameInput,
  ghostEnabled,
  setIsGhostMode,
  userMeetingStatus,
  presentationStream,
  presenterName,
  localStream,
  isCameraOff,
  isMuted,
  isHandRaised,
  participants,
  isMirrorCamera,
  activeSpeakerId,
  currentUserId,
  audioOutputDeviceId,
  activeScreenShareId,
  isScreenSharing,
  selectedParticipantForActions,
  setSelectedParticipantForActions,
  isChatOpen,
  unreadCount,
  reactionOptions,
  toggleMute,
  toggleCamera,
  toggleScreenShare,
  toggleChat,
  toggleHandRaised,
  sendReaction,
  leaveRoom,
  isParticipantsOpen,
  setIsParticipantsOpen,
  pendingUsers,
  chatMessages,
  chatInput,
  setChatInput,
  sendChat,
  chatOverlayMessages,
  setChatOverlayMessages,
  socket,
  setPendingUsers,
  showAdminTips,
  setShowAdminTips,
  setHasSeenTips,
  resolveDisplayName,
  reactions,
  isRoomLocked,
  onToggleLock,
}: MeetsMainContentProps) {
  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
      {isJoined && reactions.length > 0 && (
        <ReactionOverlay
          reactions={reactions}
          getDisplayName={resolveDisplayName}
        />
      )}
      {!isJoined ? (
        <JoinScreen
          roomId={roomId}
          onRoomIdChange={setRoomId}
          onJoin={joinRoom}
          isLoading={isLoading}
          userEmail={userEmail}
          connectionState={connectionState}
          isAdmin={isAdmin}
          showPermissionHint={showPermissionHint}
          rooms={availableRooms}
          roomsStatus={roomsStatus}
          onRefreshRooms={refreshRooms}
          onJoinRoom={joinRoomById}
          slotOptions={userSlotOptions}
          selectedSlotId={selectedSlotId}
          onSelectSlot={handleSlotSelect}
          displayNameInput={displayNameInput}
          onDisplayNameInputChange={setDisplayNameInput}
          isGhostMode={ghostEnabled}
          onGhostModeChange={setIsGhostMode}
          meetingStatus={userMeetingStatus}
        />
      ) : presentationStream ? (
        <PresentationLayout
          presentationStream={presentationStream}
          presenterName={presenterName}
          localStream={localStream}
          isCameraOff={isCameraOff}
          isHandRaised={isHandRaised}
          isGhost={ghostEnabled}
          participants={participants}
          userEmail={userEmail}
          isMirrorCamera={isMirrorCamera}
          activeSpeakerId={activeSpeakerId}
          currentUserId={currentUserId}
          audioOutputDeviceId={audioOutputDeviceId}
          getDisplayName={resolveDisplayName}
        />
      ) : (
        <GridLayout
          localStream={localStream}
          isCameraOff={isCameraOff}
          isMuted={isMuted}
          isHandRaised={isHandRaised}
          isGhost={ghostEnabled}
          participants={participants}
          userEmail={userEmail}
          isMirrorCamera={isMirrorCamera}
          activeSpeakerId={activeSpeakerId}
          currentUserId={currentUserId}
          audioOutputDeviceId={audioOutputDeviceId}
          isAdmin={isAdmin}
          selectedParticipantId={selectedParticipantForActions}
          onParticipantClick={(userId) =>
            setSelectedParticipantForActions(
              selectedParticipantForActions === userId ? null : userId
            )
          }
          getDisplayName={resolveDisplayName}
        />
      )}

      {isJoined && (
        <ControlsBar
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          activeScreenShareId={activeScreenShareId}
          isChatOpen={isChatOpen}
          unreadCount={unreadCount}
          isHandRaised={isHandRaised}
          reactionOptions={reactionOptions}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onToggleScreenShare={toggleScreenShare}
          onToggleChat={toggleChat}
          onToggleHandRaised={toggleHandRaised}
          onSendReaction={sendReaction}
          onLeave={leaveRoom}
          isAdmin={isAdmin}
          isGhostMode={ghostEnabled}
          isParticipantsOpen={isParticipantsOpen}
          onToggleParticipants={() => setIsParticipantsOpen((prev) => !prev)}
          pendingUsersCount={pendingUsers.size}
          isRoomLocked={isRoomLocked}
          onToggleLock={onToggleLock}
        />
      )}

      {isJoined && isChatOpen && (
        <ChatPanel
          messages={chatMessages}
          chatInput={chatInput}
          onInputChange={setChatInput}
          onSend={sendChat}
          onClose={toggleChat}
          currentUserId={currentUserId}
          isGhostMode={ghostEnabled}
        />
      )}

      {isJoined && isParticipantsOpen && isAdmin && (
        <ParticipantsPanel
          participants={participants}
          currentUserId={currentUserId}
          onClose={() => setIsParticipantsOpen(false)}
          socket={socket}
          isAdmin={isAdmin}
          pendingUsers={pendingUsers}
          roomId={roomId}
          getDisplayName={resolveDisplayName}
          onPendingUserStale={(staleUserId) => {
            setPendingUsers((prev) => {
              const next = new Map(prev);
              next.delete(staleUserId);
              return next;
            });
          }}
        />
      )}

      {isJoined && isAdmin && selectedParticipantForActions && (
        <AdminActionsSidebar
          participantUserId={selectedParticipantForActions}
          participants={participants}
          onClose={() => setSelectedParticipantForActions(null)}
          getDisplayName={resolveDisplayName}
        />
      )}

      {isJoined && isAdmin && showAdminTips && (
        <AdminTipsOverlay
          currentStep={0}
          onNextStep={() => setShowAdminTips(false)}
          onSkip={() => {
            setShowAdminTips(false);
            setHasSeenTips(true);
            localStorage.setItem("admin-tips-seen", "true");
          }}
          onClose={() => setShowAdminTips(false)}
        />
      )}

      {isJoined && chatOverlayMessages.length > 0 && (
        <ChatOverlay
          messages={chatOverlayMessages}
          onDismiss={(id) =>
            setChatOverlayMessages((prev) => prev.filter((m) => m.id !== id))
          }
        />
      )}
    </div>
  );
}
