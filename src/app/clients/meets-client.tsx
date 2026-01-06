"use client";

import {
  AlertCircle,
  ArrowRight,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  Phone,
  RefreshCw,
  Send,
  UserMinus,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { Device } from "mediasoup-client";
import type {
  Consumer,
  DtlsParameters,
  IceCandidate,
  IceParameters,
  Producer,
  RtpCapabilities,
  RtpParameters,
  Transport,
} from "mediasoup-client/types";
import { Roboto } from "next/font/google";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import type { GetRoomsResponse, RoomInfo } from "../../lib/sfu-types";
import { getSfuToken } from "../actions/sfu-token";
import { useSessionContext } from "../components/session-provider";
import SignupPage from "../components/sign-up";
import VideoSettings from "./components/meets/video-settings";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-roboto",
});

// ============================================
// Configuration
// ============================================

const SFU_URL = process.env.NEXT_PUBLIC_SFU_URL || "http://localhost:3031";
const RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_ATTEMPTS = 8;
const SOCKET_TIMEOUT_MS = 10000;

// ============================================
// Types & Interfaces
// ============================================

/** Connection lifecycle states */
type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "joining"
  | "joined"
  | "reconnecting"
  | "waiting"
  | "error";

/** Producer types */
type ProducerType = "webcam" | "screen";

/** Chat message */
interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  timestamp: number;
}

/** Participant in the meeting */
interface Participant {
  userId: string;
  videoStream: MediaStream | null;
  audioStream: MediaStream | null;
  screenShareStream: MediaStream | null;
  audioProducerId: string | null;
  videoProducerId: string | null;
  screenShareProducerId: string | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isLeaving?: boolean;
}

/** Producer info from server */
interface ProducerInfo {
  producerId: string;
  producerUserId: string;
  kind: "audio" | "video";
  type: ProducerType;
  paused?: boolean;
}

type VideoQuality = "low" | "standard";

const STANDARD_QUALITY_CONSTRAINTS = {
  width: { ideal: 640, max: 640 },
  height: { ideal: 360, max: 360 },
  frameRate: { ideal: 24, max: 24 },
};

const LOW_QUALITY_CONSTRAINTS = {
  width: { ideal: 256, max: 256 },
  height: { ideal: 144, max: 144 },
  frameRate: { ideal: 15, max: 15 },
};

/** Socket response types */
interface JoinRoomResponse {
  rtpCapabilities: RtpCapabilities;
  existingProducers: ProducerInfo[];
  status?: "waiting" | "joined";
}

interface TransportResponse {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
}

interface ConsumeResponse {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: RtpParameters;
}

/** Producer ownership tracking */
interface ProducerMapEntry {
  userId: string;
  kind: "audio" | "video";
  type: ProducerType;
}

/** Media device state */
interface MediaState {
  hasAudioPermission: boolean;
  hasVideoPermission: boolean;
  audioDeviceId?: string;
  videoDeviceId?: string;
}

/** Error with code for categorization */
interface MeetError {
  code:
    | "PERMISSION_DENIED"
    | "CONNECTION_FAILED"
    | "MEDIA_ERROR"
    | "TRANSPORT_ERROR"
    | "UNKNOWN";
  message: string;
  recoverable: boolean;
}

// ============================================
// Participant State Reducer
// ============================================

type ParticipantAction =
  | { type: "ADD_PARTICIPANT"; userId: string }
  | { type: "REMOVE_PARTICIPANT"; userId: string }
  | { type: "MARK_LEAVING"; userId: string }
  | {
      type: "UPDATE_STREAM";
      userId: string;
      kind: "audio" | "video";
      streamType: ProducerType;
      stream: MediaStream | null;
      producerId: string;
    }
  | { type: "UPDATE_MUTED"; userId: string; muted: boolean }
  | { type: "UPDATE_CAMERA_OFF"; userId: string; cameraOff: boolean }
  | { type: "CLEAR_ALL" };

function participantReducer(
  state: Map<string, Participant>,
  action: ParticipantAction
): Map<string, Participant> {
  const newState = new Map(state);

  switch (action.type) {
    case "ADD_PARTICIPANT": {
      if (!newState.has(action.userId)) {
        newState.set(action.userId, {
          userId: action.userId,
          videoStream: null,
          audioStream: null,
          screenShareStream: null,
          audioProducerId: null,
          videoProducerId: null,
          screenShareProducerId: null,
          isMuted: false,
          isCameraOff: false,
        });
      }
      return newState;
    }
    case "REMOVE_PARTICIPANT": {
      newState.delete(action.userId);
      return newState;
    }
    case "MARK_LEAVING": {
      const participant = newState.get(action.userId);
      if (participant) {
        newState.set(action.userId, { ...participant, isLeaving: true });
      }
      return newState;
    }
    case "UPDATE_STREAM": {
      const participant = newState.get(action.userId) || {
        userId: action.userId,
        videoStream: null,
        audioStream: null,
        screenShareStream: null,
        isMuted: false,
        isCameraOff: false,
        audioProducerId: null,
        videoProducerId: null,
        screenShareProducerId: null,
      };

      if (action.streamType === "screen") {
        participant.screenShareStream = action.stream;
        participant.screenShareProducerId = action.stream
          ? action.producerId
          : null;
      } else if (action.kind === "video") {
        participant.videoStream = action.stream;
        participant.videoProducerId = action.stream ? action.producerId : null;
        if (action.stream) participant.isCameraOff = false;
      } else if (action.kind === "audio") {
        participant.audioStream = action.stream;
        participant.audioProducerId = action.stream ? action.producerId : null;
        if (action.stream) participant.isMuted = false;
      }

      newState.set(action.userId, { ...participant });
      return newState;
    }
    case "UPDATE_MUTED": {
      const participant = newState.get(action.userId);
      if (participant) {
        newState.set(action.userId, { ...participant, isMuted: action.muted });
      }
      return newState;
    }
    case "UPDATE_CAMERA_OFF": {
      const participant = newState.get(action.userId);
      if (participant) {
        newState.set(action.userId, {
          ...participant,
          isCameraOff: action.cameraOff,
        });
      }
      return newState;
    }
    case "CLEAR_ALL": {
      return new Map();
    }
    default:
      return state;
  }
}

// ============================================
// Utility Functions
// ============================================

/** Create a meet error with proper categorization */
function createMeetError(
  error: unknown,
  defaultCode: MeetError["code"] = "UNKNOWN"
): MeetError {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("Permission denied") ||
    message.includes("NotAllowedError")
  ) {
    return {
      code: "PERMISSION_DENIED",
      message: "Camera/microphone permission denied",
      recoverable: true,
    };
  }
  if (
    message.includes("NotFoundError") ||
    message.includes("DevicesNotFoundError")
  ) {
    return {
      code: "MEDIA_ERROR",
      message: "Camera or microphone not found",
      recoverable: true,
    };
  }
  if (message.includes("Connection") || message.includes("socket")) {
    return {
      code: "CONNECTION_FAILED",
      message: "Failed to connect to server",
      recoverable: true,
    };
  }

  return { code: defaultCode, message, recoverable: false };
}

/** Generate a unique session ID for this browser tab */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/** Extract display name from user ID (email#sessionId format) */
function getDisplayName(userId: string): string {
  return userId.split("#")[0]?.split("@")[0] || userId;
}

// ============================================
// Main Component
// ============================================

export default function MeetsClient({
  initialRoomId,
}: {
  initialRoomId?: string;
}) {
  const { session } = useSessionContext();
  const [mounted, setMounted] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [roomId, setRoomId] = useState(initialRoomId || "default-room");
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeScreenShareId, setActiveScreenShareId] = useState<string | null>(
    null
  );
  const [participants, dispatchParticipants] = useReducer(
    participantReducer,
    new Map()
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [meetError, setMeetError] = useState<MeetError | null>(null);
  const [_mediaState, setMediaState] = useState<MediaState>({
    hasAudioPermission: false,
    hasVideoPermission: false,
  });
  const [videoQuality, setVideoQuality] = useState<VideoQuality>("standard");
  const [isMirrorCamera, setIsMirrorCamera] = useState(true);
  const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState(false);
  const [selectedAudioInputDeviceId, setSelectedAudioInputDeviceId] =
    useState<string>();
  const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] =
    useState<string>();

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatInput, setChatInput] = useState("");

  // Admin state
  const isAdmin = useMemo(() => {
    return (
      session?.data?.user?.email &&
      ADMIN_EMAILS.includes(session.data.user.email)
    );
  }, [session?.data?.user?.email]);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<Map<string, string>>(
    new Map()
  ); // userId -> displayName

  // Refs for WebRTC objects
  const socketRef = useRef<Socket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const producerTransportRef = useRef<Transport | null>(null);
  const consumerTransportRef = useRef<Transport | null>(null);
  const audioProducerRef = useRef<Producer | null>(null);
  const videoProducerRef = useRef<Producer | null>(null);
  const screenProducerRef = useRef<Producer | null>(null);
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const producerMapRef = useRef<Map<string, ProducerMapEntry>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const intentionalDisconnectRef = useRef(false);
  const videoQualityRef = useRef<VideoQuality>("standard");
  const currentRoomIdRef = useRef<string | null>(null);
  const handleRedirectRef = useRef<(roomId: string) => Promise<void>>(
    async () => {}
  );
  const handleReconnectRef = useRef<() => void>(async () => {});
  // Ref to trigger auto-join after redirect updates the roomId
  const shouldAutoJoinRef = useRef(false);

  // Ref to track chat open state for socket listener (avoids stale closure)
  const isChatOpenRef = useRef(false);

  // Ref to track local stream for socket listener (avoids stale closure)
  const localStreamRef = useRef<MediaStream | null>(null);

  // Generate stable session ID per component instance
  const sessionIdRef = useRef<string>(generateSessionId());
  const userEmail =
    session?.data?.user?.name || session?.data?.user?.email || "guest";
  const userAccountEmail = session?.data?.user?.email || "guest";
  const userId = `${userAccountEmail}#${sessionIdRef.current}`;

  // ============================================
  // Lifecycle & Cleanup
  // ============================================

  useEffect(() => {
    setMounted(true);
    abortControllerRef.current = new AbortController();

    // Cleanup on page unload
    const handleBeforeUnload = () => {
      cleanup();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      abortControllerRef.current?.abort();
      cleanup();
    };
  }, []);

  const cleanupRoomResources = useCallback(
    (options?: { resetRoomId?: boolean }) => {
      const resetRoomId = options?.resetRoomId !== false;
      console.log("[Meets] Cleaning up room resources...");

      // Close all consumers
      consumersRef.current.forEach((consumer) => {
        try {
          consumer.close();
        } catch {}
      });
      consumersRef.current.clear();
      producerMapRef.current.clear();

      // Close producers
      try {
        audioProducerRef.current?.close();
      } catch {}
      try {
        videoProducerRef.current?.close();
      } catch {}
      try {
        screenProducerRef.current?.close();
      } catch {}
      audioProducerRef.current = null;
      videoProducerRef.current = null;
      screenProducerRef.current = null;

      // Close transports
      try {
        producerTransportRef.current?.close();
      } catch {}
      try {
        consumerTransportRef.current?.close();
      } catch {}
      producerTransportRef.current = null;
      consumerTransportRef.current = null;

      // Note: We DO NOT stop local stream tracks here, as we might reuse them for redirect

      // Reset specific room state
      dispatchParticipants({ type: "CLEAR_ALL" });
      setIsScreenSharing(false);
      setActiveScreenShareId(null);
      // currentRoomIdRef.current = null; // Don't null this yet if redirecting? Actually better to null it.
      if (resetRoomId) {
        currentRoomIdRef.current = null;
      }
    },
    []
  );

  const cleanup = useCallback(() => {
    console.log("[Meets] Running full cleanup...");

    intentionalDisconnectRef.current = true;
    cleanupRoomResources();

    // Stop local stream tracks
    localStream?.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });

    // Disconnect socket
    socketRef.current?.disconnect();
    socketRef.current = null;
    deviceRef.current = null;

    // Reset state
    setConnectionState("disconnected");
    setLocalStream(null);
    reconnectAttemptsRef.current = 0;
  }, [localStream, cleanupRoomResources]);

  // ============================================
  // Socket Connection with Reconnection
  // ============================================

  const connectSocket = useCallback((): Promise<Socket> => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          if (socketRef.current?.connected) {
            resolve(socketRef.current);
            return;
          }

          setConnectionState("connecting");

          const token = await getSfuToken(sessionIdRef.current);

          const socket = io(SFU_URL, {
            transports: ["websocket", "polling"],
            timeout: SOCKET_TIMEOUT_MS,
            reconnection: false, // We handle reconnection manually
            auth: { token },
          });

          const connectionTimeout = setTimeout(() => {
            socket.disconnect();
            reject(new Error("Connection timeout"));
          }, SOCKET_TIMEOUT_MS);

          socket.on("connect", () => {
            clearTimeout(connectionTimeout);
            console.log("[Meets] Connected to SFU");
            setConnectionState("connected");
            setMeetError(null);
            reconnectAttemptsRef.current = 0;
            intentionalDisconnectRef.current = false;
            resolve(socket);
          });

          socket.on("disconnect", (reason) => {
            console.log("[Meets] Disconnected:", reason);
            if (intentionalDisconnectRef.current) {
              setConnectionState("disconnected");
              return;
            }

            if (currentRoomIdRef.current) {
              // Unexpected disconnect during active session (including server restart)
              handleReconnectRef.current();
            } else {
              setConnectionState("disconnected");
            }
          });

          socket.on("roomClosed", ({ reason }: { reason: string }) => {
            console.log("[Meets] Room closed:", reason);
            setMeetError({
              code: "UNKNOWN", // Or a specific code like 'ROOM_CLOSED'
              message: `Room closed: ${reason}`,
              recoverable: false,
            });
            cleanup();
          });

          socket.on("connect_error", (err) => {
            clearTimeout(connectionTimeout);
            console.error("[Meets] Connection error:", err);
            setMeetError(createMeetError(err, "CONNECTION_FAILED"));
            setConnectionState("error");
            reject(err);
          });

          // Producer events
          socket.on("newProducer", async (data: ProducerInfo) => {
            console.log("[Meets] New producer:", data);
            await consumeProducer(data);
          });

          socket.on(
            "producerClosed",
            ({ producerId }: { producerId: string }) => {
              console.log("[Meets] Producer closed:", producerId);
              handleProducerClosed(producerId);

              // Check if this was our own producer (victim logic)
              if (audioProducerRef.current?.id === producerId) {
                setIsMuted(true);
                audioProducerRef.current.close();
                audioProducerRef.current = null;
              } else if (videoProducerRef.current?.id === producerId) {
                setIsCameraOff(true);
                videoProducerRef.current.close();
                videoProducerRef.current = null;
                // Also stop local stream track
                const track = localStream?.getVideoTracks()[0];
                if (track) {
                  track.stop();
                  track.enabled = false;
                }
              } else if (screenProducerRef.current?.id === producerId) {
                if (screenProducerRef.current.track) {
                  screenProducerRef.current.track.stop();
                }
                setIsScreenSharing(false);
                screenProducerRef.current.close();
                screenProducerRef.current = null;
                setActiveScreenShareId(null);
              }
            }
          );

          // User events
          socket.on(
            "userJoined",
            ({ userId: joinedUserId }: { userId: string }) => {
              console.log("[Meets] User joined:", joinedUserId);
              dispatchParticipants({
                type: "ADD_PARTICIPANT",
                userId: joinedUserId,
              });
            }
          );

          socket.on(
            "userLeft",
            ({ userId: leftUserId }: { userId: string }) => {
              console.log("[Meets] User left:", leftUserId);

              const producersToClose = Array.from(
                producerMapRef.current.entries(),
              )
                .filter(([, info]) => info.userId === leftUserId)
                .map(([producerId]) => producerId);

              for (const producerId of producersToClose) {
                handleProducerClosed(producerId);
              }

              dispatchParticipants({
                type: "MARK_LEAVING",
                userId: leftUserId,
              });

              setTimeout(() => {
                dispatchParticipants({
                  type: "REMOVE_PARTICIPANT",
                  userId: leftUserId,
                });
              }, 100);
            }
          );

          // Media state events
          socket.on(
            "participantMuted",
            ({ userId, muted }: { userId: string; muted: boolean }) => {
              dispatchParticipants({
                type: "UPDATE_MUTED",
                userId,
                muted,
              });
            }
          );

          socket.on(
            "participantCameraOff",
            ({
              userId: camUserId,
              cameraOff,
            }: {
              userId: string;
              cameraOff: boolean;
            }) => {
              dispatchParticipants({
                type: "UPDATE_CAMERA_OFF",
                userId: camUserId,
                cameraOff,
              });
            }
          );

          socket.on(
            "setVideoQuality",
            async ({ quality }: { quality: VideoQuality }) => {
              console.log(`[Meets] Setting video quality to: ${quality}`);
              setVideoQuality(quality);
              // Trigger the quality update effect/function
              await updateVideoQualityRef.current(quality);
            }
          );

          // Chat message event
          socket.on("chatMessage", (message: ChatMessage) => {
            console.log("[Meets] Chat message received:", message);
            setChatMessages((prev) => [...prev, message]);
            // Use ref to avoid stale closure - check current chat open state
            if (!isChatOpenRef.current) {
              setUnreadCount((prev) => prev + 1);
            }
          });

          // Kicked event
          socket.on("kicked", () => {
            cleanup();
            setMeetError({
              code: "UNKNOWN",
              message: "You have been kicked from the meeting.",
              recoverable: false,
            });
          });

          // Redirect event
          socket.on(
            "redirect",
            async ({ newRoomId }: { newRoomId: string }) => {
              console.log(
                `[Meets] Redirect received. Initiating full switch to ${newRoomId}`
              );
              handleRedirectRef.current(newRoomId);
            }
          );

          // Waiting Room Events
          socket.on(
            "userRequestedJoin",
            ({
              userId,
              displayName,
            }: {
              userId: string;
              displayName: string;
            }) => {
              console.log("[Meets] User requesting to join:", userId);
              setPendingUsers((prev) => {
                const newMap = new Map(prev);
                newMap.set(userId, displayName);
                return newMap;
              });
            }
          );

          socket.on("userAdmitted", ({ userId }: { userId: string }) => {
            setPendingUsers((prev) => {
              const newMap = new Map(prev);
              newMap.delete(userId);
              return newMap;
            });
          });

          socket.on("userRejected", ({ userId }: { userId: string }) => {
            setPendingUsers((prev) => {
              const newMap = new Map(prev);
              newMap.delete(userId);
              return newMap;
            });
          });

          socket.on("pendingUserLeft", ({ userId }: { userId: string }) => {
            setPendingUsers((prev) => {
              const newMap = new Map(prev);
              newMap.delete(userId);
              return newMap;
            });
          });

          socket.on("joinApproved", () => {
            console.log("[Meets] Join approved! Re-attempting join...");
            if (currentRoomIdRef.current && localStreamRef.current) {
              joinRoomInternal(
                currentRoomIdRef.current,
                localStreamRef.current
              ).catch(console.error);
            } else {
              console.error(
                "[Meets] Cannot re-join: missing room ID or local stream",
                {
                  roomId: currentRoomIdRef.current,
                  hasStream: !!localStreamRef.current,
                }
              );
            }
          });

          socket.on("joinRejected", () => {
            console.log("[Meets] Join rejected.");
            setMeetError({
              code: "PERMISSION_DENIED",
              message: "The host has denied your request to join.",
              recoverable: false,
            });
            setConnectionState("error");
            cleanup();
          });

          socketRef.current = socket;
        } catch (err) {
          console.error("Failed to get auth token:", err);
          setMeetError({
            code: "CONNECTION_FAILED",
            message: "Authentication failed",
            recoverable: false, // Maybe true if they login?
          });
          setConnectionState("error");
          reject(err);
        }
      })();
    });
  }, []);

  const handleReconnect = useCallback(async () => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setMeetError({
        code: "CONNECTION_FAILED",
        message: "Failed to reconnect after multiple attempts",
        recoverable: false,
      });
      setConnectionState("error");
      return;
    }

    setConnectionState("reconnecting");
    reconnectAttemptsRef.current++;
    const delay = RECONNECT_DELAY_MS * 2 ** (reconnectAttemptsRef.current - 1);

    console.log(
      `[Meets] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`
    );
    await new Promise((r) => setTimeout(r, delay));

    try {
      const roomId = currentRoomIdRef.current;
      cleanupRoomResources({ resetRoomId: false });
      socketRef.current?.disconnect();
      socketRef.current = null;
      await connectSocket();

      // Rejoin room if we were in one
      const stream = localStreamRef.current || localStream;
      if (roomId && stream) {
        await joinRoomInternal(roomId, stream);
      }
    } catch (_err) {
      handleReconnect();
    }
  }, [connectSocket, localStream, cleanupRoomResources]);
  useEffect(() => {
    handleReconnectRef.current = handleReconnect;
  }, [handleReconnect]);

  const handleProducerClosed = useCallback((producerId: string) => {
    const consumer = consumersRef.current.get(producerId);
    if (consumer) {
      try {
        // Stop the track to prevent memory leaks
        if (consumer.track) {
          consumer.track.stop();
        }
        consumer.close();
      } catch {}
      consumersRef.current.delete(producerId);
    }

    const info = producerMapRef.current.get(producerId);
    if (info) {
      dispatchParticipants({
        type: "UPDATE_STREAM",
        userId: info.userId,
        kind: info.kind,
        streamType: info.type,
        stream: null,
        producerId: producerId,
      });

      if (info.kind === "video") {
        dispatchParticipants({
          type: "UPDATE_CAMERA_OFF",
          userId: info.userId,
          cameraOff: true,
        });
      } else if (info.kind === "audio") {
        dispatchParticipants({
          type: "UPDATE_MUTED",
          userId: info.userId,
          muted: true,
        });
      }

      if (info.type === "screen") {
        setActiveScreenShareId(null);
      }

      producerMapRef.current.delete(producerId);
    }
  }, []);

  // ============================================
  // Media Handling
  // ============================================

  const requestMediaPermissions =
    useCallback(async (): Promise<MediaStream | null> => {
      try {
        const videoConstraints =
          videoQuality === "low"
            ? { ...LOW_QUALITY_CONSTRAINTS }
            : { ...STANDARD_QUALITY_CONSTRAINTS };

        const audioConstraints: boolean | MediaTrackConstraints =
          selectedAudioInputDeviceId
            ? { deviceId: { exact: selectedAudioInputDeviceId } }
            : true;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: videoConstraints,
        });

        setMediaState({
          hasAudioPermission: stream.getAudioTracks().length > 0,
          hasVideoPermission: stream.getVideoTracks().length > 0,
        });

        // Handle track ended (device unplugged)
        stream.getTracks().forEach((track) => {
          track.onended = () => {
            console.log(`[Meets] Track ended: ${track.kind}`);
            if (track.kind === "video") {
              setIsCameraOff(true);
            } else if (track.kind === "audio") {
              setIsMuted(true);
            }
          };
        });

        return stream;
      } catch (err) {
        const meetErr = createMeetError(err, "PERMISSION_DENIED");
        setMeetError(meetErr);
        setIsCameraOff(true);
        if (meetErr.code === "PERMISSION_DENIED") {
          setIsMuted(true);
        }

        // Try audio-only if video fails
        if (
          meetErr.code === "PERMISSION_DENIED" ||
          meetErr.code === "MEDIA_ERROR"
        ) {
          try {
            const audioOnlyConstraints: boolean | MediaTrackConstraints =
              selectedAudioInputDeviceId
                ? { deviceId: { exact: selectedAudioInputDeviceId } }
                : true;

            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: audioOnlyConstraints,
            });
            setMediaState({
              hasAudioPermission: true,
              hasVideoPermission: false,
            });
            setIsCameraOff(true);
            return audioStream;
          } catch {
            // Complete failure
            return null;
          }
        }
        return null;
      }
    }, [videoQuality, selectedAudioInputDeviceId]);

  // Device Change Handlers

  const handleAudioInputDeviceChange = useCallback(
    async (deviceId: string) => {
      setSelectedAudioInputDeviceId(deviceId);

      // Switch microphone
      if (connectionState === "joined") {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: deviceId } },
          });

          const newAudioTrack = newStream.getAudioTracks()[0];
          if (newAudioTrack) {
            newAudioTrack.enabled = !isMuted;
            const oldAudioTrack = localStream?.getAudioTracks()[0];

            // Replace track in producer FIRST (before modifying local stream)
            if (audioProducerRef.current) {
              await audioProducerRef.current.replaceTrack({
                track: newAudioTrack,
              });
            }

            setLocalStream((prev) => {
              if (prev) {
                // Remove old audio track from stream (don't stop it yet)
                if (oldAudioTrack) {
                  prev.removeTrack(oldAudioTrack);
                }
                // Add new audio track
                prev.addTrack(newAudioTrack);
                // Now stop the old track after it's been replaced
                if (oldAudioTrack) {
                  oldAudioTrack.stop();
                }
                // Return new MediaStream to trigger re-render
                return new MediaStream(prev.getTracks());
              }
              return newStream;
            });
          }
        } catch (err) {
          console.error("[Meets] Failed to switch audio input device:", err);
        }
      }
    },
    [connectionState, isMuted, localStream]
  );

  const handleAudioOutputDeviceChange = useCallback(
    async (deviceId: string) => {
      setSelectedAudioOutputDeviceId(deviceId);

      // Update audio output for all audio elements (remote participants use <audio> elements)
      const audioElements = document.querySelectorAll("audio");
      for (const audio of audioElements) {
        const audioElement = audio as HTMLAudioElement & {
          setSinkId?: (sinkId: string) => Promise<void>;
        };
        if (audioElement.setSinkId) {
          try {
            await audioElement.setSinkId(deviceId);
          } catch (err) {
            console.error("[Meets] Failed to set audio output device:", err);
          }
        }
      }

      // Also update any video elements that might have audio
      const videoElements = document.querySelectorAll("video");
      for (const video of videoElements) {
        const videoElement = video as HTMLVideoElement & {
          setSinkId?: (sinkId: string) => Promise<void>;
        };
        if (videoElement.setSinkId) {
          try {
            await videoElement.setSinkId(deviceId);
          } catch (_err) {
            // Video elements may not have audio, so don't log errors
          }
        }
      }
    },
    []
  );

  // ============================================
  // Room Join Flow
  // ============================================

  // ============================================
  // Transport Creation
  // ============================================

  const createProducerTransport = useCallback(
    async (socket: Socket, device: Device): Promise<void> => {
      return new Promise((resolve, reject) => {
        socket.emit(
          "createProducerTransport",
          (response: TransportResponse | { error: string }) => {
            if ("error" in response) {
              reject(new Error(response.error));
              return;
            }

            const transport = device.createSendTransport(response);

            transport.on("connect", ({ dtlsParameters }, callback, errback) => {
              socket.emit(
                "connectProducerTransport",
                { transportId: transport.id, dtlsParameters },
                (res: { success: boolean } | { error: string }) => {
                  if ("error" in res) errback(new Error(res.error));
                  else callback();
                }
              );
            });

            transport.on(
              "produce",
              ({ kind, rtpParameters, appData }, callback, errback) => {
                socket.emit(
                  "produce",
                  { transportId: transport.id, kind, rtpParameters, appData },
                  (res: { producerId: string } | { error: string }) => {
                    if ("error" in res) errback(new Error(res.error));
                    else callback({ id: res.producerId });
                  }
                );
              }
            );

            transport.on("connectionstatechange", (state) => {
              console.log("[Meets] Producer transport state:", state);
              if (state === "failed" || state === "closed") {
                setMeetError({
                  code: "TRANSPORT_ERROR",
                  message: "Producer transport failed",
                  recoverable: true,
                });
              }
            });

            producerTransportRef.current = transport;
            resolve();
          }
        );
      });
    },
    []
  );

  const createConsumerTransport = useCallback(
    async (socket: Socket, device: Device): Promise<void> => {
      return new Promise((resolve, reject) => {
        socket.emit(
          "createConsumerTransport",
          (response: TransportResponse | { error: string }) => {
            if ("error" in response) {
              reject(new Error(response.error));
              return;
            }

            const transport = device.createRecvTransport(response);

            transport.on("connect", ({ dtlsParameters }, callback, errback) => {
              socket.emit(
                "connectConsumerTransport",
                { transportId: transport.id, dtlsParameters },
                (res: { success: boolean } | { error: string }) => {
                  if ("error" in res) errback(new Error(res.error));
                  else callback();
                }
              );
            });

            transport.on("connectionstatechange", (state) => {
              console.log("[Meets] Consumer transport state:", state);
            });

            consumerTransportRef.current = transport;
            resolve();
          }
        );
      });
    },
    []
  );

  // ============================================
  // Producing (Sending Media)
  // ============================================

  const produce = useCallback(
    async (stream: MediaStream): Promise<void> => {
      const transport = producerTransportRef.current;
      if (!transport) return;

      // Produce audio
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        try {
          const audioProducer = await transport.produce({
            track: audioTrack,
            appData: { type: "webcam" as ProducerType, paused: isMuted },
          });

          if (isMuted) {
            audioProducer.pause();
          }

          audioProducerRef.current = audioProducer;

          audioProducer.on("transportclose", () => {
            audioProducerRef.current = null;
          });
        } catch (err) {
          console.error("[Meets] Failed to produce audio:", err);
        }
      }

      // Produce video
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          const videoProducer = await transport.produce({
            track: videoTrack,
            encodings: [{ maxBitrate: 500000 }],
            appData: { type: "webcam" as ProducerType, paused: isCameraOff },
          });

          if (isCameraOff) {
            videoProducer.pause();
          }

          videoProducerRef.current = videoProducer;

          videoProducer.on("transportclose", () => {
            videoProducerRef.current = null;
          });
        } catch (err) {
          console.error("[Meets] Failed to produce video:", err);
        }
      }
    },
    [isMuted, isCameraOff]
  );

  // ============================================
  // Consuming (Receiving Media)
  // ============================================

  const consumeProducer = useCallback(
    async (producerInfo: ProducerInfo): Promise<void> => {
      const socket = socketRef.current;
      const device = deviceRef.current;
      const transport = consumerTransportRef.current;

      if (!socket || !device || !transport) {
        console.warn(
          "[Meets] Cannot consume: missing socket, device, or transport"
        );
        return;
      }

      return new Promise((resolve) => {
        socket.emit(
          "consume",
          {
            producerId: producerInfo.producerId,
            rtpCapabilities: device.rtpCapabilities,
          },
          async (response: ConsumeResponse | { error: string }) => {
            if ("error" in response) {
              console.error("[Meets] Consume error:", response.error);
              resolve();
              return;
            }

            try {
              const consumer = await transport.consume({
                id: response.id,
                producerId: response.producerId,
                kind: response.kind,
                rtpParameters: response.rtpParameters,
              });

              consumersRef.current.set(producerInfo.producerId, consumer);
              producerMapRef.current.set(producerInfo.producerId, {
                userId: producerInfo.producerUserId,
                kind: response.kind,
                type: producerInfo.type,
              });

              const stream = new MediaStream([consumer.track]);
              dispatchParticipants({
                type: "UPDATE_STREAM",
                userId: producerInfo.producerUserId,
                kind: response.kind,
                streamType: producerInfo.type,
                stream,
                producerId: producerInfo.producerId,
              });

              if (producerInfo.type === "screen") {
                setActiveScreenShareId(producerInfo.producerId);
              }

              // Handle initial paused state
              if (producerInfo.paused) {
                if (response.kind === "audio") {
                  dispatchParticipants({
                    type: "UPDATE_MUTED",
                    userId: producerInfo.producerUserId,
                    muted: true,
                  });
                } else if (response.kind === "video") {
                  dispatchParticipants({
                    type: "UPDATE_CAMERA_OFF",
                    userId: producerInfo.producerUserId,
                    cameraOff: true,
                  });
                }
              }

              // Resume consumer
              socket.emit(
                "resumeConsumer",
                { consumerId: consumer.id },
                () => {}
              );
              resolve();
            } catch (err) {
              console.error("[Meets] Failed to create consumer:", err);
              resolve();
            }
          }
        );
      });
    },
    []
  );

  // ============================================
  // Room Join Flow
  // ============================================

  const joinRoomInternal = useCallback(
    async (targetRoomId: string, stream: MediaStream) => {
      const socket = socketRef.current;
      if (!socket) throw new Error("Socket not connected");

      setConnectionState("joining");

      return new Promise<void>((resolve, reject) => {
        socket.emit(
          "joinRoom",
          { roomId: targetRoomId, sessionId: sessionIdRef.current },
          async (response: JoinRoomResponse | { error: string }) => {
            if ("error" in response) {
              reject(new Error(response.error));
              return;
            }

            if (response.status === "waiting") {
              setConnectionState("waiting");
              currentRoomIdRef.current = targetRoomId; // Keep track of attempted room
              resolve();
              return;
            }

            try {
              console.log(
                "[Meets] Joined room, existing producers:",
                response.existingProducers
              );
              currentRoomIdRef.current = targetRoomId;

              // Create mediasoup device
              const device = new Device();
              await device.load({
                routerRtpCapabilities: response.rtpCapabilities,
              });
              deviceRef.current = device;

              // Create transports
              await createProducerTransport(socket, device);
              await createConsumerTransport(socket, device);

              // Start producing
              await produce(stream);

              // Consume existing producers
              for (const producer of response.existingProducers) {
                await consumeProducer(producer);
              }

              setConnectionState("joined");
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    },
    [
      userId,
      produce,
      createProducerTransport,
      createConsumerTransport,
      consumeProducer,
    ]
  );

  const handleRedirectCallback = useCallback(
    async (newRoomId: string) => {
      console.log(`[Meets] Executing hard redirect to ${newRoomId}`);

      // 1. Full cleanup (disconnects socket, stops tracks)
      cleanup();

      // 2. Set new room ID
      setRoomId(newRoomId);

      // 3. Flag for auto-join
      // We need to wait for the state (roomId) to update and joinRoom to be recreated.
      shouldAutoJoinRef.current = true;
    },
    [cleanup]
  );

  useEffect(() => {
    handleRedirectRef.current = handleRedirectCallback;
  }, [handleRedirectCallback]);

  const joinRoom = useCallback(async () => {
    if (abortControllerRef.current?.signal.aborted) return;

    setMeetError(null);
    setConnectionState("connecting");
    intentionalDisconnectRef.current = false;
    let stream: MediaStream | null = null;

    try {
      const _socket = await connectSocket();
      // Get media first
      stream = await requestMediaPermissions();
      if (!stream) {
        setConnectionState("error");
        return;
      }
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Connect socket

      // Join room
      await joinRoomInternal(roomId, stream);
    } catch (err) {
      console.error("[Meets] Error joining room:", err);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
      setMeetError(createMeetError(err));
      setConnectionState("error");
    }
  }, [roomId, connectSocket]);

  // Effect to trigger auto-join after redirect updates roomId
  useEffect(() => {
    if (shouldAutoJoinRef.current) {
      console.log("[Meets] Auto-joining new room...");
      shouldAutoJoinRef.current = false;
      joinRoom();
    }
  }, [joinRoom]);

  // ============================================
  // Video Quality Switching
  // ============================================

  const updateVideoQualityRef = useRef<
    (quality: VideoQuality) => Promise<void>
  >(async () => {});

  const updateVideoQuality = useCallback(
    async (quality: VideoQuality) => {
      // Don't update if camera is explicitly off, just update state for next time
      if (isCameraOff) return;
      if (!localStream) return;

      try {
        const constraints =
          quality === "low"
            ? LOW_QUALITY_CONSTRAINTS
            : STANDARD_QUALITY_CONSTRAINTS;

        console.log(
          `[Meets] Switching to ${quality} quality`,
          JSON.stringify(constraints)
        );

        // create new video track
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: constraints,
        });
        const newVideoTrack = newStream.getVideoTracks()[0];

        // Replace track in local stream
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          oldVideoTrack.stop();
          localStream.removeTrack(oldVideoTrack);
        }
        localStream.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStream.getTracks())); // Trigger re-render if needed

        // Replace track in producer
        const producer = videoProducerRef.current;
        if (producer) {
          await producer.replaceTrack({ track: newVideoTrack });
        }

        // Clean up new stream shell (tracks already moved/used)
        // actually we used newVideoTrack from newStream, so we don't stop it.
      } catch (err) {
        console.error("[Meets] Failed to update video quality:", err);
      }
    },
    [isCameraOff, localStream]
  );

  // Keep ref up to date for socket listener
  useEffect(() => {
    updateVideoQualityRef.current = updateVideoQuality;
  }, [updateVideoQuality]);

  // Keep videoQualityRef in sync with videoQuality state
  useEffect(() => {
    videoQualityRef.current = videoQuality;
  }, [videoQuality]);

  // ============================================
  // Media Controls
  // ============================================

  const toggleMute = useCallback(async () => {
    const producer = audioProducerRef.current;

    if (producer) {
      const newMuted = !isMuted;
      if (newMuted) {
        producer.pause();
      } else {
        producer.resume();
      }
      setIsMuted(newMuted);

      socketRef.current?.emit(
        "toggleMute",
        { producerId: producer.id, paused: newMuted },
        () => {}
      );
    } else {
      // Producer doesn't exist, try to create it (unmute)
      if (isMuted) {
        try {
          setIsMuted(false); // Optimistic update
          const transport = producerTransportRef.current;
          if (!transport) return;

          // Get new audio track
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const audioTrack = stream.getAudioTracks()[0];

          if (!audioTrack) throw new Error("No audio track obtained");

          // Update local stream
          setLocalStream((prev) => {
            if (prev) {
              const newStream = new MediaStream(prev.getTracks());
              // Remove old audio tracks if any
              newStream.getAudioTracks().forEach((t) => {
                t.stop();
                newStream.removeTrack(t);
              });
              newStream.addTrack(audioTrack);
              return newStream;
            }
            return new MediaStream([audioTrack]);
          });

          const audioProducer = await transport.produce({
            track: audioTrack,
            appData: { type: "webcam" as ProducerType, paused: false },
          });

          audioProducerRef.current = audioProducer;
          audioProducer.on("transportclose", () => {
            audioProducerRef.current = null;
          });
        } catch (err) {
          console.error("[Meets] Failed to restart audio:", err);
          setIsMuted(true); // Revert
          setMeetError(createMeetError(err, "MEDIA_ERROR"));
        }
      }
    }
  }, [isMuted]);

  const toggleCamera = useCallback(async () => {
    const producer = videoProducerRef.current;

    if (producer) {
      const newCameraOff = !isCameraOff;
      if (newCameraOff) {
        producer.pause();
      } else {
        producer.resume();
      }
      setIsCameraOff(newCameraOff);

      socketRef.current?.emit(
        "toggleCamera",
        { producerId: producer.id, paused: newCameraOff },
        () => {}
      );
    } else {
      // Producer doesn't exist, try to create it (turn camera on)
      if (isCameraOff) {
        try {
          setIsCameraOff(false); // Optimistic
          const transport = producerTransportRef.current;
          if (!transport) return;

          // Get new video track
          const stream = await navigator.mediaDevices.getUserMedia({
            video:
              videoQualityRef.current === "low"
                ? LOW_QUALITY_CONSTRAINTS
                : STANDARD_QUALITY_CONSTRAINTS,
          });
          const videoTrack = stream.getVideoTracks()[0];

          if (!videoTrack) throw new Error("No video track obtained");

          // Update local stream
          setLocalStream((prev) => {
            if (prev) {
              const newStream = new MediaStream(prev.getTracks());
              // Remove old video tracks
              newStream.getVideoTracks().forEach((t) => {
                t.stop();
                newStream.removeTrack(t);
              });
              newStream.addTrack(videoTrack);
              return newStream;
            }
            return new MediaStream([videoTrack]);
          });

          const videoProducer = await transport.produce({
            track: videoTrack,
            encodings: [{ maxBitrate: 500000 }],
            appData: { type: "webcam" as ProducerType, paused: false },
          });

          videoProducerRef.current = videoProducer;
          videoProducer.on("transportclose", () => {
            videoProducerRef.current = null;
          });
        } catch (err) {
          console.error("[Meets] Failed to restart video:", err);
          setIsCameraOff(true); // Revert
          setMeetError(createMeetError(err, "MEDIA_ERROR"));
        }
      }
    }
  }, [isCameraOff]);

  // Sync localStream to ref
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop sharing
      const producer = screenProducerRef.current;
      if (producer) {
        socketRef.current?.emit(
          "closeProducer",
          { producerId: producer.id },
          () => {}
        );
        try {
          producer.close();
        } catch {}
        if (producer.track) {
          producer.track.onended = null;
        }
      }
      screenProducerRef.current = null;
      setIsScreenSharing(false);
      return;
    }

    // Check if someone else is sharing
    if (activeScreenShareId) {
      setMeetError({
        code: "UNKNOWN",
        message: "Someone else is already sharing their screen",
        recoverable: true,
      });
      return;
    }

    const transport = producerTransportRef.current;
    if (!transport) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const track = stream.getVideoTracks()[0];

      const producer = await transport.produce({
        track,
        appData: { type: "screen" as ProducerType },
      });

      screenProducerRef.current = producer;
      setIsScreenSharing(true);

      // Handle browser-level screen share stop
      track.onended = () => {
        socketRef.current?.emit(
          "closeProducer",
          { producerId: producer.id },
          () => {}
        );
        try {
          producer.close();
        } catch {}
        screenProducerRef.current = null;
        setIsScreenSharing(false);
      };
    } catch (err) {
      // User cancelled screen share selection
      if ((err as Error).name === "NotAllowedError") {
        console.log("[Meets] Screen share cancelled by user");
      } else {
        console.error("[Meets] Error starting screen share:", err);
        setMeetError(createMeetError(err, "MEDIA_ERROR"));
      }
    }
  }, [isScreenSharing, activeScreenShareId]);

  const leaveRoom = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const sendChat = useCallback((content: string) => {
    const socket = socketRef.current;
    if (!socket || !content.trim()) return;

    socket.emit(
      "sendChat",
      { content: content.trim() },
      (
        response:
          | { success: boolean; message?: ChatMessage }
          | { error: string }
      ) => {
        if ("error" in response) {
          console.error("[Meets] Chat error:", response.error);
          return;
        }
        if (response.message) {
          // Add our own message to the list
          const newMessage = response.message;
          setChatMessages((prev) => [...prev, newMessage]);
        }
      }
    );
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      const newValue = !prev;
      isChatOpenRef.current = newValue;
      if (newValue) {
        // Opening chat, clear unread
        setUnreadCount(0);
      }
      return newValue;
    });
  }, []);

  // ============================================
  // Local Video Ref Callback
  // ============================================

  const _setLocalVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && localStream) {
        node.srcObject = localStream;
        node.play().catch((err) => {
          if (err.name !== "AbortError") {
            console.error("[Meets] Local video play error:", err);
          }
        });
      }
      localVideoRef.current = node;
    },
    [localStream]
  );

  // ============================================
  // Render Helpers
  // ============================================

  if (!mounted) return null;

  // Show login page if not authenticated
  if (!session?.data?.user) {
    return <SignupPage onSignIn={() => {}} />;
  }

  // Determine presentation mode
  let presentationStream: MediaStream | null = null;
  let presenterName = "";

  if (isScreenSharing && screenProducerRef.current?.track) {
    presentationStream = new MediaStream([screenProducerRef.current.track]);
    presenterName = "You";
  } else if (activeScreenShareId) {
    for (const p of participants.values()) {
      if (p.screenShareStream) {
        presentationStream = p.screenShareStream;
        presenterName = getDisplayName(p.userId);
        break;
      }
    }
  }

  const isPresentationMode = !!presentationStream;
  const isJoined = connectionState === "joined";
  const isLoading =
    connectionState === "connecting" ||
    connectionState === "joining" ||
    connectionState === "reconnecting" ||
    connectionState === "waiting"; // Waiting is a kind of loading state visually, or handled separately

  if (connectionState === "waiting") {
    return (
      <div className="flex flex-col h-full w-full bg-[#252525] items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-2xl font-bold mb-2">Waiting for host...</h2>
        <p className="text-white/60">Using room ID: {roomId}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#1a1a1a] text-white ${roboto.className}`}
      style={{ fontFamily: "'Roboto', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#151515] border-b border-white/5">
        <div className="flex items-center gap-2">
          <h1
            className="text-xl font-bold tracking-[0.5px]"
            style={{ fontWeight: 700 }}
          >
            ACM c0nclav3
          </h1>
          {isJoined && (
            <div className="flex items-stretch gap-2 ml-2 hidden sm:flex h-8">
              <div
                className="flex items-center bg-white/5 px-3 rounded-md text-sm text-white/80 border border-white/10"
                style={{ fontWeight: 500 }}
              >
                <span className="text-white/40 mr-2">Room:</span>
                <span
                  className="font-bold tabular-nums"
                  style={{ fontWeight: 700 }}
                >
                  {roomId}
                </span>
              </div>
              <VideoSettings
                isMirrorCamera={isMirrorCamera}
                isOpen={isVideoSettingsOpen}
                onToggleOpen={() => setIsVideoSettingsOpen((prev) => !prev)}
                onToggleMirror={() => setIsMirrorCamera((prev) => !prev)}
                isCameraOff={isCameraOff}
                selectedAudioInputDeviceId={selectedAudioInputDeviceId}
                selectedAudioOutputDeviceId={selectedAudioOutputDeviceId}
                onAudioInputDeviceChange={handleAudioInputDeviceChange}
                onAudioOutputDeviceChange={handleAudioOutputDeviceChange}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isScreenSharing && (
            <span
              className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-2 py-0.5 rounded-full animate-pulse tracking-[0.5px]"
              style={{ fontWeight: 500 }}
            >
              Screen is being shared
            </span>
          )}
          {connectionState === "reconnecting" && (
            <span
              className="bg-yellow-600 text-xs px-2 py-1 rounded flex items-center gap-1 tracking-[0.5px]"
              style={{ fontWeight: 500 }}
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
              Reconnecting...
            </span>
          )}
          <ConnectionIndicator state={connectionState} />
        </div>
      </div>

      {/* Error Banner */}
      {meetError && (
        <div className="p-3 bg-red-900/50 border-b border-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-200">
            <AlertCircle className="w-4 h-4" />
            <span>{meetError.message}</span>
          </div>
          <button
            onClick={() => setMeetError(null)}
            className="p-1 hover:bg-red-800/50 rounded-full transition-colors text-red-200"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
        {!isJoined ? (
          /* Join Screen */
          <JoinScreen
            roomId={roomId}
            onRoomIdChange={setRoomId}
            onJoin={joinRoom}
            isLoading={isLoading}
            userEmail={userEmail}
            connectionState={connectionState}
            isAdmin={!!isAdmin}
          />
        ) : presentationStream ? (
          /* Presentation Layout */
          <PresentationLayout
            presentationStream={presentationStream}
            presenterName={presenterName}
            localStream={localStream}
            isCameraOff={isCameraOff}
            participants={participants}
            userEmail={userEmail}
            isMirrorCamera={isMirrorCamera}
            audioOutputDeviceId={selectedAudioOutputDeviceId}
          />
        ) : (
          /* Grid Layout */
          <GridLayout
            localStream={localStream}
            isCameraOff={isCameraOff}
            isMuted={isMuted}
            participants={participants}
            userEmail={userEmail}
            isMirrorCamera={isMirrorCamera}
            audioOutputDeviceId={selectedAudioOutputDeviceId}
          />
        )}

        {/* Controls Bar */}
        {isJoined && (
          <ControlsBar
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            isScreenSharing={isScreenSharing}
            activeScreenShareId={activeScreenShareId}
            isChatOpen={isChatOpen}
            unreadCount={unreadCount}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onToggleScreenShare={toggleScreenShare}
            onToggleChat={toggleChat}
            onLeave={leaveRoom}
            isAdmin={isAdmin}
            isParticipantsOpen={isParticipantsOpen}
            onToggleParticipants={() => setIsParticipantsOpen((prev) => !prev)}
          />
        )}

        {/* Chat Panel */}
        {isJoined && isChatOpen && (
          <ChatPanel
            messages={chatMessages}
            chatInput={chatInput}
            onInputChange={setChatInput}
            onSend={sendChat}
            onClose={toggleChat}
            currentUserId={userId}
          />
        )}

        {/* Admin Participants Panel */}
        {isJoined && isParticipantsOpen && isAdmin && (
          <ParticipantsPanel
            participants={participants}
            currentUserId={userId}
            onClose={() => setIsParticipantsOpen(false)}
            socket={socketRef.current}
            isAdmin={isAdmin}
            pendingUsers={pendingUsers}
            roomId={roomId}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// Sub-Components
// ============================================

function ConnectionIndicator({ state }: { state: ConnectionState }) {
  const colors: Record<ConnectionState, string> = {
    disconnected: "bg-neutral-600",
    connecting: "bg-yellow-500 animate-pulse",
    connected: "bg-green-500",
    joining: "bg-yellow-500 animate-pulse",
    joined: "bg-green-500",
    reconnecting: "bg-yellow-500 animate-pulse",
    waiting: "bg-blue-500 animate-pulse",
    error: "bg-red-500",
  };

  const labels: Record<ConnectionState, string> = {
    disconnected: "Disconnected",
    connecting: "Connecting...",
    connected: "Connected",
    joining: "Joining...",
    joined: "In Meeting",
    reconnecting: "Reconnecting...",
    waiting: "Waiting...",
    error: "Error",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${colors[state]}`} />
      <span className="text-xs text-neutral-500 tracking-wider">
        {labels[state]}
      </span>
    </div>
  );
}

interface JoinScreenProps {
  roomId: string;
  onRoomIdChange: (id: string) => void;
  onJoin: () => void;
  isLoading: boolean;
  userEmail: string;
  connectionState: ConnectionState;
  isAdmin: boolean;
}

function JoinScreen({
  roomId,
  onRoomIdChange,
  onJoin,
  isLoading,
  userEmail,
  connectionState,
  isAdmin,
}: JoinScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <div className="text-center mb-4">
        <h2
          className="text-2xl font-bold mb-2 tracking-[0.5px]"
          style={{ fontWeight: 700 }}
        >
          Join a meeting
        </h2>
        <p className="text-gray-400" style={{ fontWeight: 500 }}>
          Logged in as: {userEmail}
        </p>
      </div>

      <input
        type="text"
        value={roomId}
        onChange={(e) => onRoomIdChange(e.target.value)}
        placeholder="Enter Room ID"
        disabled={isLoading || !isAdmin}
        className="px-4 py-2 bg-[#252525] border border-white/10 rounded-md w-64 text-center focus:outline-none focus:border-white transition-colors disabled:opacity-50 placeholder:text-neutral-600"
      />

      <button
        onClick={onJoin}
        disabled={isLoading || !roomId.trim()}
        className="px-6 py-2 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-2 text-sm tracking-[0.5px]"
        style={{ fontWeight: 500 }}
      >
        {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
        {connectionState === "reconnecting"
          ? "Reconnecting..."
          : isLoading
          ? "Joining..."
          : "Join Room"}
      </button>
    </div>
  );
}

interface PresentationLayoutProps {
  presentationStream: MediaStream;
  presenterName: string;
  localStream: MediaStream | null;
  isCameraOff: boolean;
  participants: Map<string, Participant>;
  userEmail: string;
  isMirrorCamera: boolean;
  audioOutputDeviceId?: string;
}

function PresentationLayout({
  presentationStream,
  presenterName,
  localStream,
  isCameraOff,
  participants,
  userEmail,
  isMirrorCamera,
  audioOutputDeviceId,
}: PresentationLayoutProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Sync localStream to video element when stream changes
  useEffect(() => {
    const video = localVideoRef.current;
    if (video && localStream) {
      video.srcObject = localStream;
      video.play().catch((err) => {
        if (err.name !== "AbortError") {
          console.error("[Meets] Presentation local video play error:", err);
        }
      });
    }
  }, [localStream]);

  return (
    <div className="flex flex-1 gap-4 overflow-hidden">
      {/* Main Presentation Area */}
      <div className="flex-1 bg-[#252525] border border-white/5 rounded-lg overflow-hidden relative flex items-center justify-center">
        <video
          ref={(el) => {
            if (el && presentationStream) el.srcObject = presentationStream;
          }}
          autoPlay
          playsInline
          className="max-w-full max-h-full"
        />
        <div
          className="absolute top-2 left-2 bg-black/40 px-2 py-1 rounded text-white text-sm tracking-[0.5px]"
          style={{ fontWeight: 500 }}
        >
          {presenterName} is presenting
        </div>
      </div>

      {/* Sidebar Participants - scrollable with fixed-height tiles */}
      <div className="w-64 flex flex-col gap-3 overflow-y-auto pr-1">
        {/* Local User */}
        <div className="relative bg-[#252525] border border-white/5 rounded-lg overflow-hidden h-36 shrink-0">
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
              <div className="w-10 h-10 rounded-full bg-[#333] border border-white/10 flex items-center justify-center text-lg">
                {userEmail[0]?.toUpperCase() || "?"}
              </div>
            </div>
          )}
          <div
            className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 border border-white/5 rounded text-xs"
            style={{ fontWeight: 500 }}
          >
            You
          </div>
        </div>

        {/* Remote Participants */}
        {Array.from(participants.values()).map((participant, _index) => (
          <ParticipantVideo
            key={participant.userId}
            participant={participant}
            compact
            audioOutputDeviceId={audioOutputDeviceId}
          />
        ))}
      </div>
    </div>
  );
}

interface GridLayoutProps {
  localStream: MediaStream | null;
  isCameraOff: boolean;
  isMuted: boolean;
  participants: Map<string, Participant>;
  userEmail: string;
  isMirrorCamera: boolean;
  audioOutputDeviceId?: string;
}

function GridLayout({
  localStream,
  isCameraOff,
  isMuted,
  participants,
  userEmail,
  isMirrorCamera,
  audioOutputDeviceId,
}: GridLayoutProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Sync localStream to video element when stream changes
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

  const totalParticipants = participants.size + 1;

  const getGridLayout = (count: number) => {
    if (count === 1) return "grid-cols-1 grid-rows-1";
    if (count === 2) return "grid-cols-2 grid-rows-1";
    if (count === 3) return "grid-cols-3 grid-rows-1";
    if (count === 4) return "grid-cols-2 grid-rows-2";
    if (count <= 6) return "grid-cols-3 grid-rows-2";
    if (count <= 9) return "grid-cols-3 grid-rows-3";
    if (count <= 12) return "grid-cols-4 grid-rows-3";
    if (count <= 16) return "grid-cols-4 grid-rows-4";
    return "grid-cols-5 grid-rows-4";
  };

  const gridClass = getGridLayout(totalParticipants);

  return (
    <div className={`flex-1 grid ${gridClass} gap-3 overflow-auto p-2`}>
      {/* Local Video */}
      <div className="relative bg-[#111] border border-white/10 rounded-lg overflow-hidden">
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
        <div
          className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 border border-white/5 rounded text-sm flex items-center gap-2"
          style={{ fontWeight: 500 }}
        >
          You {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
        </div>
      </div>

      {/* Remote Participants */}
      {Array.from(participants.values()).map((participant, _index) => (
        <ParticipantVideo
          key={participant.userId}
          participant={participant}
          audioOutputDeviceId={audioOutputDeviceId}
        />
      ))}
    </div>
  );
}

interface ControlsBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  activeScreenShareId: string | null;
  isChatOpen: boolean;
  unreadCount: number;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
  isAdmin?: boolean | null;
  isParticipantsOpen?: boolean;
  onToggleParticipants?: () => void;
}

function ControlsBar({
  isMuted,
  isCameraOff,
  isScreenSharing,
  activeScreenShareId,
  isChatOpen,
  unreadCount,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onLeave,
  isAdmin,
  isParticipantsOpen,
  onToggleParticipants,
}: ControlsBarProps) {
  const canStartScreenShare = !activeScreenShareId || isScreenSharing;

  return (
    <div className="flex justify-center gap-2 mt-4 shrink-0">
      {isAdmin && (
        <button
          onClick={onToggleParticipants}
          className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center ${
            isParticipantsOpen
              ? "bg-white text-black hover:bg-neutral-200"
              : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
          }`}
          title="Participants"
        >
          <Users className="w-5 h-5" />
        </button>
      )}

      <button
        onClick={onToggleMute}
        className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center ${
          isMuted
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
        }`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      <button
        onClick={onToggleCamera}
        className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center ${
          isCameraOff
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
        }`}
        title={isCameraOff ? "Turn on camera" : "Turn off camera"}
      >
        {isCameraOff ? (
          <VideoOff className="w-5 h-5" />
        ) : (
          <Video className="w-5 h-5" />
        )}
      </button>

      <button
        onClick={onToggleScreenShare}
        disabled={!canStartScreenShare}
        className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center ${
          isScreenSharing
            ? "bg-white text-black hover:bg-neutral-200"
            : !canStartScreenShare
            ? "bg-[#1a1a1a] text-neutral-600 cursor-not-allowed"
            : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
        }`}
        title={
          !canStartScreenShare
            ? "Someone else is presenting"
            : isScreenSharing
            ? "Stop sharing"
            : "Share screen"
        }
      >
        <Monitor className="w-5 h-5" />
      </button>

      <button
        onClick={onToggleChat}
        className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center relative ${
          isChatOpen
            ? "bg-white text-black hover:bg-neutral-200"
            : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
        }`}
        title="Chat"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-white text-black text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center tabular-nums"
            style={{ fontWeight: 500 }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <button
        onClick={onLeave}
        className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 flex items-center justify-center"
        title="Leave meeting"
      >
        <Phone className="rotate-[135deg] w-5 h-5" />
      </button>
    </div>
  );
}

interface ChatPanelProps {
  messages: ChatMessage[];
  chatInput: string;
  onInputChange: (value: string) => void;
  onSend: (content: string) => void;
  onClose: () => void;
  currentUserId: string;
}

function ChatPanel({
  messages,
  chatInput,
  onInputChange,
  onSend,
  onClose,
  currentUserId,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSend(chatInput);
      onInputChange("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      className="absolute right-4 top-4 bottom-20 w-80 bg-[#1f1f1f] rounded-lg shadow-2xl flex flex-col border border-white/5 z-10"
      style={{ fontFamily: "'Roboto', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <h3 className="text-sm tracking-[0.5px]" style={{ fontWeight: 700 }}>
          Chat
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center text-sm">No messages yet</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.userId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isOwn ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    isOwn
                      ? "bg-white text-black"
                      : "bg-[#2a2a2a] text-neutral-200 border border-white/5"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs text-gray-400 mb-1">
                      {msg.displayName}
                    </p>
                  )}
                  <p className="text-sm break-words">{msg.content}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1 tabular-nums">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-white/5 bg-[#1f1f1f]"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={1000}
            className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-white/5 rounded-md text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-neutral-600"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

interface ParticipantVideoProps {
  participant: Participant;
  compact?: boolean;
  audioOutputDeviceId?: string;
}

function ParticipantVideo({
  participant,
  compact = false,
  audioOutputDeviceId,
}: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsNew(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && participant.videoStream) {
        node.srcObject = participant.videoStream;
        node.play().catch((err) => {
          if (err.name !== "AbortError") {
            console.error("[Meets] Video play error:", err);
          }
        });
      }
      videoRef.current = node;
    },
    [participant.videoStream]
  );

  const setAudioRef = useCallback(
    (node: HTMLAudioElement | null) => {
      if (node && participant.audioStream) {
        node.srcObject = participant.audioStream;
        node.play().catch((err) => {
          if (err.name !== "AbortError") {
            console.error("[Meets] Audio play error:", err);
          }
        });

        // Set audio output device if specified
        if (audioOutputDeviceId) {
          const audioElement = node as HTMLAudioElement & {
            setSinkId?: (sinkId: string) => Promise<void>;
          };
          if (audioElement.setSinkId) {
            audioElement.setSinkId(audioOutputDeviceId).catch((err) => {
              console.error("[Meets] Failed to set audio output:", err);
            });
          }
        }
      }
      audioRef.current = node;
    },
    [participant.audioStream, audioOutputDeviceId]
  );

  // Update audio output when device changes
  useEffect(() => {
    if (audioRef.current && audioOutputDeviceId) {
      const audioElement = audioRef.current as HTMLAudioElement & {
        setSinkId?: (sinkId: string) => Promise<void>;
      };
      if (audioElement.setSinkId) {
        audioElement.setSinkId(audioOutputDeviceId).catch((err) => {
          console.error("[Meets] Failed to update audio output:", err);
        });
      }
    }
  }, [audioOutputDeviceId]);

  const displayName = getDisplayName(participant.userId);
  const showPlaceholder = !participant.videoStream || participant.isCameraOff;

  return (
    <div
      className={`relative bg-[#111] border border-white/10 rounded-lg overflow-hidden ${
        compact ? "h-36 shrink-0" : "w-full h-full"
      } ${
        isNew
          ? "animate-participant-join"
          : participant.isLeaving
          ? "animate-participant-leave"
          : ""
      }`}
    >
      <video
        ref={setVideoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${
          showPlaceholder ? "hidden" : ""
        }`}
      />
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#252525]">
          <div
            className={`rounded-full bg-[#333] border border-white/10 flex items-center justify-center ${
              compact ? "w-10 h-10 text-lg" : "w-16 h-16 text-2xl"
            }`}
          >
            {displayName[0]?.toUpperCase() || "?"}
          </div>
        </div>
      )}
      <audio ref={setAudioRef} autoPlay />
      <div
        className={`absolute bottom-2 left-2 bg-black/60 border border-white/5 rounded px-2 py-0.5 flex items-center gap-2 ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        <span style={{ fontWeight: 500 }}>{displayName}</span>
        {participant.isMuted && <MicOff className="w-3 h-3 text-red-500" />}
      </div>
    </div>
  );
}

interface ParticipantsPanelProps {
  participants: Map<string, Participant>;
  currentUserId: string;
  onClose: () => void;
  pendingUsers?: Map<string, string>;
  roomId: string;
}

function ParticipantsPanel({
  participants,
  currentUserId,
  onClose,
  socket,
  isAdmin,
  pendingUsers,
  roomId,
}: ParticipantsPanelProps & {
  socket: Socket | null;
  isAdmin?: boolean | null;
}) {
  const participantsList = Array.from(participants.values());
  const pendingList = pendingUsers ? Array.from(pendingUsers.entries()) : [];
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);
  const [selectedUserForRedirect, setSelectedUserForRedirect] = useState<
    string | null
  >(null);
  const filteredRooms = availableRooms.filter((room) => room.id !== roomId);

  const handleCloseProducer = (producerId: string) => {
    if (!socket || !isAdmin) return;
    socket.emit("closeRemoteProducer", { producerId }, (res: any) => {
      if (res.error) console.error("Failed to close producer:", res.error);
    });
  };

  const openRedirectModal = (userId: string) => {
    setSelectedUserForRedirect(userId);
    socket?.emit("getRooms", (response: GetRoomsResponse) => {
      setAvailableRooms(response.rooms || []);
      setShowRedirectModal(true);
    });
  };

  const handleRedirect = (roomId: string) => {
    if (!selectedUserForRedirect || !socket) return;

    socket.emit(
      "redirectUser",
      { userId: selectedUserForRedirect, newRoomId: roomId },
      (res: { error?: string }) => {
        if (res.error) {
          console.error("Redirect failed:", res.error);
        } else {
          console.log("Redirect success");
          setShowRedirectModal(false);
          setSelectedUserForRedirect(null);
        }
      }
    );
  };

  return (
    <div
      className="absolute right-4 top-4 bottom-20 w-80 bg-[#1f1f1f] rounded-lg shadow-2xl flex flex-col border border-white/5 z-10"
      style={{ fontFamily: "'Roboto', sans-serif" }}
    >
      {/* Header */}
      <div className="flex flex-col border-b border-white/5">
        <div className="flex items-center justify-between p-3">
          <h3 className="text-sm tracking-[0.5px]" style={{ fontWeight: 700 }}>
            Participants (
            <span className="tabular-nums">{participantsList.length + 1}</span>)
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {isAdmin && (
          <div className="px-3 pb-3 flex gap-2">
            <button
              onClick={() =>
                socket?.emit("muteAll", (res: unknown) =>
                  console.log("Muted all:", res)
                )
              }
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors border border-red-500/20 tracking-[0.5px]"
              style={{ fontWeight: 500 }}
              title="Mute all participants"
            >
              <MicOff className="w-3 h-3" />
              Mute All
            </button>
            <button
              onClick={() =>
                socket?.emit("closeAllVideo", (res: unknown) =>
                  console.log("Stopped all video:", res)
                )
              }
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors border border-red-500/20 tracking-[0.5px]"
              style={{ fontWeight: 500 }}
              title="Stop video for all participants"
            >
              <VideoOff className="w-3 h-3" />
              Stop Video
            </button>
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {isAdmin && pendingList.length > 0 && (
        <div className="p-3 border-b border-white/10 bg-blue-500/10">
          <h4 className="font-bold text-xs text-blue-400 mb-2 uppercase tracking-wide">
            Pending Requests ({pendingList.length})
          </h4>
          <div className="space-y-2">
            {pendingList.map(([userId, displayName]) => (
              <div
                key={userId}
                className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/10"
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] border border-white/10 shrink-0">
                    {displayName[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-sm truncate text-white/80">
                    {displayName}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() =>
                      socket?.emit("admitUser", { userId }, () => {})
                    }
                    className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded transition-colors text-xs font-medium"
                    title="Admit"
                  >
                    Admit
                  </button>
                  <button
                    onClick={() =>
                      socket?.emit("rejectUser", { userId }, () => {})
                    }
                    className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded transition-colors text-xs font-medium"
                    title="Reject"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {participantsList.map((p) => {
          const isMe = p.userId === currentUserId;
          const displayName = getDisplayName(p.userId);

          return (
            <div
              key={p.userId}
              className={`flex items-center justify-between p-2 rounded-lg border ${
                isMe
                  ? "bg-white/5 border-white/20"
                  : "bg-transparent border-white/5"
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                <div
                  className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs border border-white/10 shrink-0"
                  style={{ fontWeight: 500 }}
                >
                  {displayName[0]?.toUpperCase() || "?"}
                </div>
                <span className="text-sm truncate" style={{ fontWeight: 500 }}>
                  {displayName} {isMe && "(You)"}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {p.screenShareStream && (
                  <div className="flex items-center gap-1">
                    <Monitor className="w-3 h-3 text-green-500" />
                    {isAdmin && !isMe && p.screenShareProducerId && (
                      <button
                        onClick={() => {
                          if (p.screenShareProducerId)
                            handleCloseProducer(p.screenShareProducerId);
                        }}
                        className="text-red-500 hover:text-red-400"
                        title="Stop screen share"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {p.isCameraOff ? (
                  <VideoOff className="w-3 h-3 text-red-500" />
                ) : isAdmin && !isMe && p.videoProducerId ? (
                  <button
                    onClick={() => {
                      if (p.videoProducerId)
                        handleCloseProducer(p.videoProducerId);
                    }}
                    className="flex items-center gap-1 text-red-500 hover:text-red-400 p-1 hover:bg-white/5 rounded transition-colors"
                    title="Stop video"
                  >
                    <Video className="w-3 h-3 text-green-500" />
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <Video className="w-3 h-3 text-green-500" />
                )}

                {p.isMuted ? (
                  <MicOff className="w-3 h-3 text-red-500" />
                ) : isAdmin && !isMe && p.audioProducerId ? (
                  <button
                    onClick={() => {
                      if (p.audioProducerId)
                        handleCloseProducer(p.audioProducerId);
                    }}
                    className="flex items-center gap-1 text-red-500 hover:text-red-400 p-1 hover:bg-white/5 rounded transition-colors"
                    title="Stop audio"
                  >
                    <Mic className="w-3 h-3 text-green-500" />
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <Mic className="w-3 h-3 text-green-500" />
                )}
              </div>

              {isAdmin && !isMe && (
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => openRedirectModal(p.userId)}
                    className="text-blue-500 hover:text-blue-400 p-1 hover:bg-white/5 rounded transition-colors"
                    title="Redirect user"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      socket?.emit("kickUser", { userId: p.userId }, () => {})
                    }
                    className="text-red-500 hover:text-red-400 p-1 hover:bg-white/5 rounded transition-colors"
                    title="Kick user"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Redirect Modal Overlay */}
      {showRedirectModal && (
        <div className="absolute inset-0 bg-[#1a1a1a] z-20 flex flex-col pt-4 pb-2 px-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3 px-2">
            <div>
              <h4
                className="text-sm tracking-[0.5px] text-white"
                style={{ fontWeight: 700 }}
              >
                Select Room
              </h4>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Redirect user to another room
              </p>
            </div>
            <button
              onClick={() => setShowRedirectModal(false)}
              className="text-neutral-400 hover:text-white p-1 hover:bg-white/5 rounded transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 px-1 custom-scrollbar">
            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-neutral-500 gap-2">
                <AlertCircle className="w-8 h-8 opacity-20" />
                <p className="text-sm">No other active rooms</p>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleRedirect(room.id)}
                  className="w-full text-left p-3 rounded-lg bg-[#252525] hover:bg-[#333] border border-white/5 hover:border-white/10 transition-all flex justify-between items-center group relative overflow-hidden"
                >
                  <div className="flex flex-col z-10">
                    <span
                      className="text-sm text-white group-hover:text-blue-400 transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      {room.id}
                    </span>
                    <span className="text-[10px] text-neutral-500 group-hover:text-neutral-400">
                      ID: {room.id.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-3 z-10">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-black/20 px-2 py-1 rounded">
                      <Users className="w-3 h-3" />
                      <span className="tabular-nums">{room.userCount}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
