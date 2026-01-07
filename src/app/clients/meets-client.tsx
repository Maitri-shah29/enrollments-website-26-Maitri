"use client";

import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  Info,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  Phone,
  RefreshCw,
  Send,
  Smile,
  UserCheck,
  UserMinus,
  UserX,
  Users,
  Video,
  VideoOff,
  X,
  XCircle,
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
import {
  getMeetingUserFullData,
  verifyMeetingAttendance,
  promoteMeetingUser,
  rejectMeetingUser,
  addMeetingComment,
  assignMeetingTask,
  updateMeetingTask,
  type MeetingUserDetails,
  type MeetingRoundUser,
  type UserFormSubmission,
} from "../actions/meeting-admin-actions";
import { getReactionFiles } from "../actions/reactions";
import { getSfuRooms } from "../actions/sfu-rooms";
import { getSfuJoinInfo } from "../actions/sfu-join";
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

const RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_ATTEMPTS = 8;
const SOCKET_TIMEOUT_MS = 10000;
const SPEAKER_CHECK_INTERVAL_MS = 250;
const SPEAKER_THRESHOLD = 0.03;
const ACTIVE_SPEAKER_HOLD_MS = 900;
const REACTION_LIFETIME_MS = 3800;
const MAX_REACTIONS = 30;
const EMOJI_REACTIONS = ["👍", "👏", "😂", "❤️", "🎉", "😮"] as const;

type ReactionEmoji = (typeof EMOJI_REACTIONS)[number];
type ReactionKind = "emoji" | "asset";

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

interface ReactionNotification {
  userId: string;
  emoji?: string;
  kind?: ReactionKind;
  value?: string;
  label?: string;
  timestamp: number;
}

interface ReactionPayload {
  userId: string;
  kind: ReactionKind;
  value: string;
  label?: string;
  timestamp?: number;
}

interface ReactionEvent extends ReactionPayload {
  id: string;
  timestamp: number;
  lane: number;
}

interface ReactionOption {
  id: string;
  kind: ReactionKind;
  value: string;
  label: string;
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

interface AudioAnalyserEntry {
  analyser: AnalyserNode;
  data: Uint8Array<ArrayBuffer>;
  source: MediaStreamAudioSourceNode;
  streamId: string;
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
      const existing = newState.get(action.userId);
      if (existing) {
        newState.set(action.userId, { ...existing, isLeaving: false });
        return newState;
      }
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

      const updated = { ...participant };

      if (action.streamType === "screen") {
        updated.screenShareStream = action.stream;
        updated.screenShareProducerId = action.stream
          ? action.producerId
          : null;
      } else if (action.kind === "video") {
        updated.videoStream = action.stream;
        updated.videoProducerId = action.stream ? action.producerId : null;
        if (action.stream) updated.isCameraOff = false;
      } else if (action.kind === "audio") {
        updated.audioStream = action.stream;
        updated.audioProducerId = action.stream ? action.producerId : null;
        if (action.stream) updated.isMuted = false;
      }

      newState.set(action.userId, updated);
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

/** Format a readable display name from user identifiers or emails */
function formatDisplayName(raw: string): string {
  const base = raw.split("#")[0] || raw;
  const handle = base.split("@")[0] || base;
  const tokens = handle.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const words = tokens
    .map((token) => token.match(/^[A-Za-z]+/)?.[0] || "")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase());

  return words.length > 0 ? words.join(" ") : handle || raw;
}

/** Extract display name from user ID (email#sessionId format) */
function getDisplayName(userId: string): string {
  return formatDisplayName(userId);
}

function isReactionEmoji(value: string): value is ReactionEmoji {
  return EMOJI_REACTIONS.includes(value as ReactionEmoji);
}

function formatReactionLabel(fileName: string): string {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const words = baseName
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase());

  return words.length ? words.slice(0, 2).join(" ") : baseName || "Reaction";
}

function buildAssetReaction(fileName: string): ReactionOption {
  return {
    id: `asset-${fileName}`,
    kind: "asset",
    value: `/reactions/${encodeURIComponent(fileName)}`,
    label: formatReactionLabel(fileName),
  };
}

function isValidAssetPath(value: string): boolean {
  return value.startsWith("/reactions/") && !value.includes("..");
}

function getSpeakerHighlightClasses(isActive: boolean): string {
  return isActive
    ? "border-emerald-300/90 ring-4 ring-emerald-400/45 shadow-[0_0_26px_rgba(16,185,129,0.28)]"
    : "";
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
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);
  const [roomsStatus, setRoomsStatus] = useState<"idle" | "loading" | "error">(
    "idle"
  );
  const [participants, dispatchParticipants] = useReducer(
    participantReducer,
    new Map()
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [meetError, setMeetError] = useState<MeetError | null>(null);
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
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

  // Reactions state
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const baseReactionOptions = useMemo<ReactionOption[]>(
    () =>
      EMOJI_REACTIONS.map((emoji) => ({
        id: `emoji-${emoji}`,
        kind: "emoji",
        value: emoji,
        label: emoji,
      })),
    []
  );
  const [customReactionOptions, setCustomReactionOptions] = useState<
    ReactionOption[]
  >([]);
  const reactionOptions = useMemo(
    () => [...baseReactionOptions, ...customReactionOptions],
    [baseReactionOptions, customReactionOptions]
  );
  const [showPermissionHint, setShowPermissionHint] = useState(false);

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
  const [selectedParticipantForActions, setSelectedParticipantForActions] =
    useState<string | null>(null); // userId of participant to show actions for

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
  const pendingProducersRef = useRef<Map<string, ProducerInfo>>(new Map());
  const reactionTimeoutsRef = useRef<Map<string, number>>(new Map());
  const lastReactionSentRef = useRef<number>(0);
  const leaveTimeoutsRef = useRef<Map<string, number>>(new Map());
  const intentionalTrackStopsRef = useRef<WeakSet<MediaStreamTrack>>(
    new WeakSet()
  );
  const permissionHintTimeoutRef = useRef<number | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectInFlightRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);
  const videoQualityRef = useRef<VideoQuality>("standard");
  const currentRoomIdRef = useRef<string | null>(null);
  const handleRedirectRef = useRef<(roomId: string) => Promise<void>>(
    async () => {}
  );
  const handleReconnectRef = useRef<() => void>(async () => {});
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserMapRef = useRef<Map<string, AudioAnalyserEntry>>(new Map());
  const lastActiveSpeakerRef = useRef<{ id: string; ts: number } | null>(null);
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

  const stopLocalTrack = useCallback((track?: MediaStreamTrack | null) => {
    if (!track) return;
    intentionalTrackStopsRef.current.add(track);
    try {
      track.stop();
    } catch {}
  }, []);

  const consumeIntentionalStop = useCallback(
    (track?: MediaStreamTrack | null) => {
      if (!track) return false;
      const marked = intentionalTrackStopsRef.current.has(track);
      if (marked) {
        intentionalTrackStopsRef.current.delete(track);
      }
      return marked;
    },
    []
  );

  const handleLocalTrackEnded = useCallback(
    (kind: "audio" | "video", track: MediaStreamTrack) => {
      if (consumeIntentionalStop(track)) return;

      if (kind === "audio") {
        setIsMuted(true);
        const producer = audioProducerRef.current;
        if (producer) {
          socketRef.current?.emit(
            "closeProducer",
            { producerId: producer.id },
            () => {}
          );
          try {
            producer.close();
          } catch {}
          audioProducerRef.current = null;
        }
      } else {
        setIsCameraOff(true);
        const producer = videoProducerRef.current;
        if (producer) {
          socketRef.current?.emit(
            "closeProducer",
            { producerId: producer.id },
            () => {}
          );
          try {
            producer.close();
          } catch {}
          videoProducerRef.current = null;
        }
      }

      setLocalStream((prev) => {
        if (!prev) return prev;
        const remaining = prev.getTracks().filter((t) => t.kind !== kind);
        return new MediaStream(remaining);
      });
    },
    [consumeIntentionalStop]
  );

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

  useEffect(() => {
    let isActive = true;

    const loadReactions = async () => {
      try {
        const files = await getReactionFiles();
        if (!isActive) return;
        setCustomReactionOptions(files.map(buildAssetReaction));
      } catch (error) {
        console.warn("[Meets] Failed to load reactions:", error);
      }
    };

    loadReactions();
    return () => {
      isActive = false;
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
      pendingProducersRef.current.clear();
      reactionTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      reactionTimeoutsRef.current.clear();
      leaveTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      leaveTimeoutsRef.current.clear();
      setReactions([]);
      setPendingUsers(new Map());

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
      stopLocalTrack(track);
    });

    // Disconnect socket
    socketRef.current?.disconnect();
    socketRef.current = null;
    deviceRef.current = null;

    // Reset state
    setConnectionState("disconnected");
    setLocalStream(null);
    setWaitingMessage(null);
    reconnectAttemptsRef.current = 0;
  }, [localStream, cleanupRoomResources, stopLocalTrack]);

  const getAudioContext = useCallback(() => {
    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextConstructor) return null;

    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContextConstructor();
    }

    return audioContextRef.current;
  }, []);

  const playNotificationSound = useCallback(
    (type: "join" | "leave") => {
      const audioContext = getAudioContext();
      if (!audioContext) return;

      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }

      const now = audioContext.currentTime;
      const frequencies =
        type === "join" ? [523.25, 659.25] : [392.0, 261.63];
      const duration = 0.12;
      const gap = 0.03;

      frequencies.forEach((frequency, index) => {
        const start = now + index * (duration + gap);
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.16, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
      });
    },
    [getAudioContext]
  );

  const primeAudioOutput = useCallback(() => {
    const audioContext = getAudioContext();
    if (!audioContext) return;
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  }, [getAudioContext]);

  const addReaction = useCallback((reaction: ReactionPayload) => {
    if (reaction.kind === "emoji" && !isReactionEmoji(reaction.value)) return;
    if (reaction.kind === "asset" && !isValidAssetPath(reaction.value)) return;

    const reactionId = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const lane = 12 + Math.random() * 76;
    const event: ReactionEvent = {
      id: reactionId,
      userId: reaction.userId,
      kind: reaction.kind,
      value: reaction.value,
      label: reaction.label,
      timestamp: reaction.timestamp || Date.now(),
      lane,
    };

    setReactions((prev) => {
      const next = [...prev, event];
      return next.length > MAX_REACTIONS ? next.slice(-MAX_REACTIONS) : next;
    });

    const timeoutId = window.setTimeout(() => {
      setReactions((prev) => prev.filter((item) => item.id !== reactionId));
      reactionTimeoutsRef.current.delete(reactionId);
    }, REACTION_LIFETIME_MS);
    reactionTimeoutsRef.current.set(reactionId, timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      reactionTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      reactionTimeoutsRef.current.clear();
    };
  }, []);

  const scheduleParticipantRemoval = useCallback((leftUserId: string) => {
    const existingTimeout = leaveTimeoutsRef.current.get(leftUserId);
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }
    const timeoutId = window.setTimeout(() => {
      leaveTimeoutsRef.current.delete(leftUserId);
      dispatchParticipants({ type: "REMOVE_PARTICIPANT", userId: leftUserId });
    }, 200);
    leaveTimeoutsRef.current.set(leftUserId, timeoutId);
  }, []);

  const isRoomEvent = useCallback((eventRoomId?: string) => {
    if (!eventRoomId) return true;
    if (!currentRoomIdRef.current) return true;
    return eventRoomId === currentRoomIdRef.current;
  }, []);

  // ============================================
  // Socket Connection with Reconnection
  // ============================================

  const connectSocket = useCallback((targetRoomId: string): Promise<Socket> => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          if (socketRef.current?.connected) {
            resolve(socketRef.current);
            return;
          }

          setConnectionState("connecting");

          const roomIdForJoin =
            targetRoomId || currentRoomIdRef.current || "";
          if (!roomIdForJoin) {
            throw new Error("Missing room ID");
          }

          const { token, sfuUrl } = await getSfuJoinInfo(
            roomIdForJoin,
            sessionIdRef.current,
          );

          const socket = io(sfuUrl, {
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
            setWaitingMessage(null);
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
                  stopLocalTrack(track);
                  track.enabled = false;
                }
                setLocalStream((prev) => {
                  if (!prev) return prev;
                  const remaining = prev
                    .getTracks()
                    .filter((item) => item.kind !== "video");
                  return new MediaStream(remaining);
                });
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
              if (joinedUserId !== userId) {
                playNotificationSound("join");
              }
              const leaveTimeout = leaveTimeoutsRef.current.get(joinedUserId);
              if (leaveTimeout) {
                window.clearTimeout(leaveTimeout);
                leaveTimeoutsRef.current.delete(joinedUserId);
              }
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
              if (leftUserId !== userId) {
                playNotificationSound("leave");
              }

              const producersToClose = Array.from(
                producerMapRef.current.entries(),
              )
                .filter(([, info]) => info.userId === leftUserId)
                .map(([producerId]) => producerId);

              for (const [producerId, info] of pendingProducersRef.current) {
                if (info.producerUserId === leftUserId) {
                  pendingProducersRef.current.delete(producerId);
                }
              }

              for (const producerId of producersToClose) {
                handleProducerClosed(producerId);
              }

              dispatchParticipants({
                type: "MARK_LEAVING",
                userId: leftUserId,
              });

              scheduleParticipantRemoval(leftUserId);
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

          socket.on("reaction", (reaction: ReactionNotification) => {
            if (reaction.kind && reaction.value) {
              addReaction({
                userId: reaction.userId,
                kind: reaction.kind,
                value: reaction.value,
                label: reaction.label,
                timestamp: reaction.timestamp,
              });
              return;
            }

            if (reaction.emoji) {
              addReaction({
                userId: reaction.userId,
                kind: "emoji",
                value: reaction.emoji,
                timestamp: reaction.timestamp,
              });
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
              roomId: eventRoomId,
            }: {
              userId: string;
              displayName: string;
              roomId?: string;
            }) => {
              if (!isRoomEvent(eventRoomId)) return;
              console.log("[Meets] User requesting to join:", userId);
              setPendingUsers((prev) => {
                const newMap = new Map(prev);
                newMap.set(userId, displayName);
                return newMap;
              });
            }
          );

          socket.on(
            "pendingUsersSnapshot",
            ({
              users,
              roomId: eventRoomId,
            }: {
              users: { userId: string; displayName?: string }[];
              roomId?: string;
            }) => {
              if (!isRoomEvent(eventRoomId)) return;
              const snapshot = new Map(
                (users || []).map(({ userId, displayName }) => [
                  userId,
                  displayName || userId,
                ])
              );
              setPendingUsers(snapshot);
            }
          );

          socket.on(
            "userAdmitted",
            ({ userId, roomId: eventRoomId }: { userId: string; roomId?: string }) => {
              if (!isRoomEvent(eventRoomId)) return;
              setPendingUsers((prev) => {
                const newMap = new Map(prev);
                newMap.delete(userId);
                return newMap;
              });
            }
          );

          socket.on(
            "userRejected",
            ({ userId, roomId: eventRoomId }: { userId: string; roomId?: string }) => {
              if (!isRoomEvent(eventRoomId)) return;
              setPendingUsers((prev) => {
                const newMap = new Map(prev);
                newMap.delete(userId);
                return newMap;
              });
            }
          );

          socket.on(
            "pendingUserLeft",
            ({ userId, roomId: eventRoomId }: { userId: string; roomId?: string }) => {
              if (!isRoomEvent(eventRoomId)) return;
              setPendingUsers((prev) => {
                const newMap = new Map(prev);
                newMap.delete(userId);
                return newMap;
              });
            }
          );

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
            setWaitingMessage(null);
            cleanup();
          });

          socket.on(
            "waitingRoomStatus",
            ({
              message,
              roomId: eventRoomId,
            }: {
              message: string;
              roomId?: string;
            }) => {
              if (!isRoomEvent(eventRoomId)) return;
              setWaitingMessage(message);
            }
          );

          socketRef.current = socket;
        } catch (err) {
          console.error("Failed to get join info:", err);
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
    if (reconnectInFlightRef.current) return;
    reconnectInFlightRef.current = true;

    try {
      while (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        setConnectionState("reconnecting");
        reconnectAttemptsRef.current++;
        const delay =
          RECONNECT_DELAY_MS * 2 ** (reconnectAttemptsRef.current - 1);

        console.log(
          `[Meets] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`
        );
        await new Promise((r) => setTimeout(r, delay));

        try {
          const roomId = currentRoomIdRef.current;
          cleanupRoomResources({ resetRoomId: false });
          socketRef.current?.disconnect();
          socketRef.current = null;
          if (!roomId) {
            throw new Error("Missing room ID for reconnect");
          }
          await connectSocket(roomId);

          const stream = localStreamRef.current || localStream;
          if (roomId && stream) {
            await joinRoomInternal(roomId, stream);
          }
          return;
        } catch (_err) {
          // Continue retry loop.
        }
      }

      setMeetError({
        code: "CONNECTION_FAILED",
        message: "Failed to reconnect after multiple attempts",
        recoverable: false,
      });
      setConnectionState("error");
    } finally {
      reconnectInFlightRef.current = false;
    }
  }, [connectSocket, localStream, cleanupRoomResources]);
  useEffect(() => {
    handleReconnectRef.current = handleReconnect;
  }, [handleReconnect]);

  const handleProducerClosed = useCallback((producerId: string) => {
    pendingProducersRef.current.delete(producerId);
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

      if (info.kind === "video" && info.type === "webcam") {
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
      if (permissionHintTimeoutRef.current) {
        window.clearTimeout(permissionHintTimeoutRef.current);
      }
      setShowPermissionHint(false);
      permissionHintTimeoutRef.current = window.setTimeout(() => {
        setShowPermissionHint(true);
      }, 450);

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
          video: isCameraOff ? false : videoConstraints,
        });

        setMediaState({
          hasAudioPermission: stream.getAudioTracks().length > 0,
          hasVideoPermission: stream.getVideoTracks().length > 0,
        });

        // Handle track ended (device unplugged)
        stream.getTracks().forEach((track) => {
          track.onended = () => {
            console.log(`[Meets] Track ended: ${track.kind}`);
            if (track.kind === "audio" || track.kind === "video") {
              handleLocalTrackEnded(
                track.kind as "audio" | "video",
                track
              );
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
            const audioTrack = audioStream.getAudioTracks()[0];
            if (audioTrack) {
              audioTrack.onended = () => {
                handleLocalTrackEnded("audio", audioTrack);
              };
            }
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
      } finally {
        if (permissionHintTimeoutRef.current) {
          window.clearTimeout(permissionHintTimeoutRef.current);
          permissionHintTimeoutRef.current = null;
        }
        setShowPermissionHint(false);
      }
    }, [videoQuality, selectedAudioInputDeviceId, isCameraOff, handleLocalTrackEnded]);

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
            newAudioTrack.onended = () => {
              handleLocalTrackEnded("audio", newAudioTrack);
            };
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
                  stopLocalTrack(oldAudioTrack);
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
    [connectionState, isMuted, localStream, handleLocalTrackEnded, stopLocalTrack]
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
      if (consumersRef.current.has(producerInfo.producerId)) {
        return;
      }

      const socket = socketRef.current;
      const device = deviceRef.current;
      const transport = consumerTransportRef.current;

      if (!socket || !device || !transport) {
        pendingProducersRef.current.set(producerInfo.producerId, producerInfo);
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

              const updateMutedState = (muted: boolean) => {
                dispatchParticipants({
                  type: "UPDATE_MUTED",
                  userId: producerInfo.producerUserId,
                  muted,
                });
              };

              const updateCameraState = (cameraOff: boolean) => {
                if (producerInfo.type !== "webcam") return;
                dispatchParticipants({
                  type: "UPDATE_CAMERA_OFF",
                  userId: producerInfo.producerUserId,
                  cameraOff,
                });
              };

              const handleTrackMuted = () => {
                if (response.kind === "audio") {
                  updateMutedState(true);
                } else {
                  updateCameraState(true);
                }
              };

              const handleTrackUnmuted = () => {
                if (response.kind === "audio") {
                  updateMutedState(false);
                } else {
                  updateCameraState(false);
                }
              };

              consumer.on("trackended", () => {
                handleProducerClosed(producerInfo.producerId);
              });
              consumer.track.onmute = handleTrackMuted;
              consumer.track.onunmute = handleTrackUnmuted;
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
                } else if (
                  response.kind === "video" &&
                  producerInfo.type === "webcam"
                ) {
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
    [handleProducerClosed]
  );

  const flushPendingProducers = useCallback(async () => {
    if (!pendingProducersRef.current.size) return;
    const pending = Array.from(pendingProducersRef.current.values());
    pendingProducersRef.current.clear();
    for (const producerInfo of pending) {
      await consumeProducer(producerInfo);
    }
  }, [consumeProducer]);

  // ============================================
  // Room Join Flow
  // ============================================

  const joinRoomInternal = useCallback(
    async (targetRoomId: string, stream: MediaStream) => {
      const socket = socketRef.current;
      if (!socket) throw new Error("Socket not connected");

      setWaitingMessage(null);
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
              await flushPendingProducers();

              setConnectionState("joined");
              playNotificationSound("join");
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
      flushPendingProducers,
      playNotificationSound,
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

  const startJoin = useCallback(
    async (targetRoomId: string) => {
      if (abortControllerRef.current?.signal.aborted) return;

      setMeetError(null);
      setConnectionState("connecting");
      primeAudioOutput();
      intentionalDisconnectRef.current = false;
      setRoomId(targetRoomId);
      let stream: MediaStream | null = null;

      try {
        const _socket = await connectSocket(targetRoomId);
        stream = await requestMediaPermissions();
        if (!stream) {
          setConnectionState("error");
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        await joinRoomInternal(targetRoomId, stream);
      } catch (err) {
        console.error("[Meets] Error joining room:", err);
        if (stream) {
          stream.getTracks().forEach((track) => stopLocalTrack(track));
          setLocalStream(null);
        }
        setMeetError(createMeetError(err));
        setConnectionState("error");
      }
    },
    [connectSocket, requestMediaPermissions, joinRoomInternal, primeAudioOutput, stopLocalTrack]
  );

  const joinRoom = useCallback(async () => {
    await startJoin(roomId);
  }, [roomId, startJoin]);

  const joinRoomById = useCallback(
    async (targetRoomId: string) => {
      await startJoin(targetRoomId);
    },
    [startJoin]
  );

  const refreshRooms = useCallback(async () => {
    if (!isAdmin) return;
    setRoomsStatus("loading");

    try {
      const data = await getSfuRooms();
      setAvailableRooms(Array.isArray(data.rooms) ? data.rooms : []);
      setRoomsStatus("idle");
    } catch (_error) {
      setRoomsStatus("error");
      setAvailableRooms([]);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && connectionState !== "joined") {
      refreshRooms();
    }
  }, [isAdmin, connectionState, refreshRooms]);

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

        const currentTrack = localStream.getVideoTracks()[0];
        if (currentTrack && currentTrack.readyState === "live") {
          currentTrack.onended = () => {
            handleLocalTrackEnded("video", currentTrack);
          };
          try {
            await currentTrack.applyConstraints(constraints);
            return;
          } catch (err) {
            console.warn(
              "[Meets] applyConstraints failed, reopening camera:",
              err
            );
          }
        }

        // Fall back to reopening camera if constraints cannot be applied
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: constraints,
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        newVideoTrack.onended = () => {
          handleLocalTrackEnded("video", newVideoTrack);
        };

        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          stopLocalTrack(oldVideoTrack);
          localStream.removeTrack(oldVideoTrack);
        }
        localStream.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStream.getTracks())); // Trigger re-render if needed

        const producer = videoProducerRef.current;
        if (producer) {
          await producer.replaceTrack({ track: newVideoTrack });
        }
      } catch (err) {
        console.error("[Meets] Failed to update video quality:", err);
      }
    },
    [isCameraOff, localStream, handleLocalTrackEnded, stopLocalTrack]
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
    let producer = audioProducerRef.current;
    const nextMuted = !isMuted;

    if (producer && producer.track?.readyState !== "live") {
      socketRef.current?.emit(
        "closeProducer",
        { producerId: producer.id },
        () => {}
      );
      try {
        producer.close();
      } catch {}
      audioProducerRef.current = null;
      producer = null;
    }

    if (nextMuted) {
      const currentTrack = localStreamRef.current?.getAudioTracks()[0];
      if (currentTrack) {
        stopLocalTrack(currentTrack);
      }

      setLocalStream((prev) => {
        if (!prev) return prev;
        const remaining = prev
          .getTracks()
          .filter((track) => track.kind !== "audio");
        return new MediaStream(remaining);
      });

      if (producer) {
        try {
          await producer.replaceTrack({ track: null });
        } catch (err) {
          console.warn("[Meets] Failed to detach audio track:", err);
        }
        try {
          producer.pause();
        } catch {}
        socketRef.current?.emit(
          "toggleMute",
          { producerId: producer.id, paused: true },
          () => {}
        );
      }

      setIsMuted(true);
      return;
    }

    try {
      const transport = producerTransportRef.current;
      if (!transport) return;

      const audioConstraints: boolean | MediaTrackConstraints =
        selectedAudioInputDeviceId
          ? { deviceId: { exact: selectedAudioInputDeviceId } }
          : true;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      const audioTrack = stream.getAudioTracks()[0];

      if (!audioTrack) throw new Error("No audio track obtained");
      audioTrack.onended = () => {
        handleLocalTrackEnded("audio", audioTrack);
      };

      setLocalStream((prev) => {
        if (prev) {
          const newStream = new MediaStream(prev.getTracks());
          newStream.getAudioTracks().forEach((t) => {
            stopLocalTrack(t);
            newStream.removeTrack(t);
          });
          newStream.addTrack(audioTrack);
          return newStream;
        }
        return new MediaStream([audioTrack]);
      });

      if (producer) {
        await producer.replaceTrack({ track: audioTrack });
        try {
          producer.resume();
        } catch {}
        socketRef.current?.emit(
          "toggleMute",
          { producerId: producer.id, paused: false },
          () => {}
        );
      } else {
        const audioProducer = await transport.produce({
          track: audioTrack,
          appData: { type: "webcam" as ProducerType, paused: false },
        });

        audioProducerRef.current = audioProducer;
        audioProducer.on("transportclose", () => {
          audioProducerRef.current = null;
        });
      }

      setIsMuted(false);
    } catch (err) {
      console.error("[Meets] Failed to restart audio:", err);
      setIsMuted(true);
      setMeetError(createMeetError(err, "MEDIA_ERROR"));
    }
  }, [
    isMuted,
    selectedAudioInputDeviceId,
    handleLocalTrackEnded,
    stopLocalTrack,
  ]);

  const toggleCamera = useCallback(async () => {
    const producer = videoProducerRef.current;

    if (producer) {
      const newCameraOff = !isCameraOff;
      if (newCameraOff) {
        setIsCameraOff(true);
        socketRef.current?.emit(
          "closeProducer",
          { producerId: producer.id },
          (response: { success: boolean } | { error: string }) => {
            if ("error" in response) {
              console.error("[Meets] Failed to close video producer:", response);
            }
          }
        );
        try {
          producer.close();
        } catch {}
        videoProducerRef.current = null;

        setLocalStream((prev) => {
          if (!prev) return prev;
          prev.getVideoTracks().forEach((track) => {
            stopLocalTrack(track);
          });
          const remainingTracks = prev
            .getTracks()
            .filter((track) => track.kind !== "video");
          return new MediaStream(remainingTracks);
        });
        return;
      }

      // Turning camera on with existing producer (resume only if track is live)
      if (producer.track?.readyState === "live") {
        producer.resume();
        setIsCameraOff(false);
        socketRef.current?.emit(
          "toggleCamera",
          { producerId: producer.id, paused: false },
          () => {}
        );
        return;
      }

      socketRef.current?.emit(
        "closeProducer",
        { producerId: producer.id },
        (response: { success: boolean } | { error: string }) => {
          if ("error" in response) {
            console.error("[Meets] Failed to close stale video producer:", response);
          }
        }
      );
      try {
        producer.close();
      } catch {}
      videoProducerRef.current = null;
    }

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
        videoTrack.onended = () => {
          handleLocalTrackEnded("video", videoTrack);
        };

        // Update local stream
        setLocalStream((prev) => {
          if (prev) {
            prev.getVideoTracks().forEach((track) => {
              stopLocalTrack(track);
            });
            const remainingTracks = prev
              .getTracks()
              .filter((track) => track.kind !== "video");
            return new MediaStream([...remainingTracks, videoTrack]);
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
  }, [isCameraOff, handleLocalTrackEnded, stopLocalTrack]);

  // Sync localStream to ref
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    const sources = new Map<string, MediaStream>();
    const localAudioTrack = localStream?.getAudioTracks()[0];

    if (
      localStream &&
      localAudioTrack &&
      localAudioTrack.enabled &&
      localAudioTrack.readyState === "live" &&
      !isMuted
    ) {
      sources.set(userId, localStream);
    }

    for (const participant of participants.values()) {
      if (!participant.audioStream || participant.isMuted) continue;
      const track = participant.audioStream.getAudioTracks()[0];
      if (!track || !track.enabled || track.readyState !== "live") continue;
      sources.set(participant.userId, participant.audioStream);
    }

    const analyserMap = audioAnalyserMapRef.current;

    for (const [id, entry] of analyserMap) {
      if (!sources.has(id)) {
        entry.source.disconnect();
        entry.analyser.disconnect();
        analyserMap.delete(id);
      }
    }

    if (!sources.size) {
      analyserMap.forEach((entry) => {
        entry.source.disconnect();
        entry.analyser.disconnect();
      });
      analyserMap.clear();
      lastActiveSpeakerRef.current = null;
      setActiveSpeakerId((prev) => (prev ? null : prev));
      return;
    }

    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const audioContext =
      audioContextRef.current || new AudioContextConstructor();
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    for (const [id, stream] of sources) {
      const streamId = stream.id;
      const existing = analyserMap.get(id);
      if (existing && existing.streamId === streamId) {
        continue;
      }

      if (existing) {
        existing.source.disconnect();
        existing.analyser.disconnect();
        analyserMap.delete(id);
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);
      analyserMap.set(id, { analyser, data, source, streamId });
    }

    const interval = window.setInterval(() => {
      let loudestId: string | null = null;
      let maxLevel = SPEAKER_THRESHOLD;

      for (const [id, entry] of analyserMap) {
        entry.analyser.getByteTimeDomainData(entry.data);
        let sumSquares = 0;
        for (let i = 0; i < entry.data.length; i += 1) {
          const normalized = (entry.data[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / entry.data.length);
        if (rms > maxLevel) {
          maxLevel = rms;
          loudestId = id;
        }
      }

      const now = Date.now();

      if (loudestId) {
        lastActiveSpeakerRef.current = { id: loudestId, ts: now };
        setActiveSpeakerId((prev) => (prev === loudestId ? prev : loudestId));
        return;
      }

      if (
        lastActiveSpeakerRef.current &&
        now - lastActiveSpeakerRef.current.ts < ACTIVE_SPEAKER_HOLD_MS
      ) {
        const lingeringId = lastActiveSpeakerRef.current.id;
        setActiveSpeakerId((prev) =>
          prev === lingeringId ? prev : lingeringId
        );
        return;
      }

      if (lastActiveSpeakerRef.current) {
        lastActiveSpeakerRef.current = null;
      }
      setActiveSpeakerId((prev) => (prev ? null : prev));
    }, SPEAKER_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [participants, localStream, isMuted, userId]);

  useEffect(() => {
    return () => {
      audioAnalyserMapRef.current.forEach((entry) => {
        entry.source.disconnect();
        entry.analyser.disconnect();
      });
      audioAnalyserMapRef.current.clear();
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, []);

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
    playNotificationSound("leave");
    cleanup();
  }, [cleanup, playNotificationSound]);

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

  const sendReaction = useCallback(
    (reaction: ReactionOption) => {
      // Throttle to prevent duplicate sends
      const now = Date.now();
      if (now - lastReactionSentRef.current < 100) {
        return;
      }
      lastReactionSentRef.current = now;

      addReaction({
        userId,
        kind: reaction.kind,
        value: reaction.value,
        label: reaction.label,
        timestamp: now,
      });

      if (reaction.kind === "emoji" && !isReactionEmoji(reaction.value)) return;
      if (reaction.kind === "asset" && !isValidAssetPath(reaction.value))
        return;
      const socket = socketRef.current;
      if (!socket) return;

      const payload =
        reaction.kind === "emoji"
          ? {
              kind: "emoji" as const,
              value: reaction.value,
              emoji: reaction.value,
              label: reaction.label,
            }
          : {
              kind: "asset" as const,
              value: reaction.value,
              label: reaction.label,
            };

      socket.emit(
        "sendReaction",
        payload,
        (response: { success: boolean } | { error: string }) => {
          if ("error" in response) {
            console.error("[Meets] Reaction error:", response.error);
          }
        }
      );
    },
    [addReaction, userId]
  );

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
    const waitingTitle = waitingMessage ?? "Waiting for host...";
    const waitingIntro = waitingMessage
      ? "The host left the room, so there is no one available to admit you right now."
      : "Please wait to be let in.";
    return (
      <div className="flex flex-col h-full w-full bg-[#252525] items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-2xl font-bold mb-2">{waitingTitle}</h2>
        <p className="text-white/70 text-center max-w-lg px-4">
          {waitingIntro} If you are facing issues or have questions, please feel
          free to ask away on the ACM Community Informal WhatsApp Group{" "}
          <a
            href="https://chat.whatsapp.com/Lj6GFN4bLggBJmQWBwUSTz"
            className="text-blue-300 hover:text-blue-200 underline"
            target="_blank"
            rel="noreferrer"
          >
            here
          </a>
          .
        </p>
        {isAdmin && <p className="text-white/60">Using room ID: {roomId}</p>}
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
              {isAdmin && (
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
              )}
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
        {isJoined && reactions.length > 0 && (
          <ReactionOverlay reactions={reactions} />
        )}
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
            showPermissionHint={showPermissionHint}
            rooms={availableRooms}
            roomsStatus={roomsStatus}
            onRefreshRooms={refreshRooms}
            onJoinRoom={joinRoomById}
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
            activeSpeakerId={activeSpeakerId}
            currentUserId={userId}
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
            activeSpeakerId={activeSpeakerId}
            currentUserId={userId}
            audioOutputDeviceId={selectedAudioOutputDeviceId}
            isAdmin={isAdmin ?? false}
            selectedParticipantId={selectedParticipantForActions}
            onParticipantClick={(userId) =>
              setSelectedParticipantForActions(
                selectedParticipantForActions === userId ? null : userId
              )
            }
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
            reactionOptions={reactionOptions}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onToggleScreenShare={toggleScreenShare}
            onToggleChat={toggleChat}
            onSendReaction={sendReaction}
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
            onPendingUserStale={(staleUserId) => {
              setPendingUsers((prev) => {
                const next = new Map(prev);
                next.delete(staleUserId);
                return next;
              });
            }}
          />
        )}

        {/* Admin Actions Sidebar - Opens when clicking participant video */}
        {isJoined && isAdmin && selectedParticipantForActions && (
          <AdminActionsSidebar
            participantUserId={selectedParticipantForActions}
            participants={participants}
            onClose={() => setSelectedParticipantForActions(null)}
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
  onJoinRoom: (roomId: string) => void;
  isLoading: boolean;
  userEmail: string;
  connectionState: ConnectionState;
  isAdmin: boolean;
  showPermissionHint: boolean;
  rooms: RoomInfo[];
  roomsStatus: "idle" | "loading" | "error";
  onRefreshRooms: () => void;
}

function JoinScreen({
  roomId,
  onRoomIdChange,
  onJoin,
  onJoinRoom,
  isLoading,
  userEmail,
  connectionState,
  isAdmin,
  showPermissionHint,
  rooms,
  roomsStatus,
  onRefreshRooms,
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

        {isAdmin && (
          <input
            type="text"
            value={roomId}
            onChange={(e) => onRoomIdChange(e.target.value)}
            placeholder="Enter Room ID"
            disabled={isLoading}
            className="px-4 py-2 bg-[#252525] border border-white/10 rounded-md w-64 text-center focus:outline-none focus:border-white transition-colors disabled:opacity-50 placeholder:text-neutral-600"
          />
        )}

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

      {showPermissionHint && (
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          <AlertCircle className="w-3.5 h-3.5 text-blue-300" />
          <span>
            Please allow camera/microphone permissions to connect to the
            meeting.
          </span>
        </div>
      )}

      {isAdmin && (
        <div className="w-full max-w-2xl mt-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-sm tracking-[0.5px]" style={{ fontWeight: 700 }}>
              Active meetings
            </h3>
            <button
              onClick={onRefreshRooms}
              disabled={roomsStatus === "loading"}
              className="text-xs px-3 py-1 rounded bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 disabled:opacity-50 transition-colors"
              style={{ fontWeight: 500 }}
            >
              {roomsStatus === "loading" ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {roomsStatus === "loading" ? (
            <div className="flex items-center justify-center gap-2 py-6 text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading rooms...</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-sm text-neutral-500 text-center py-6">
              {roomsStatus === "error"
                ? "Unable to load rooms. Try again."
                : "No active rooms right now."}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[#252525] border border-white/5"
                  >
                    <div className="min-w-0">
                      <div
                        className="text-sm text-white truncate"
                        style={{ fontWeight: 600 }}
                      >
                        {room.id}
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className="tabular-nums">
                          {room.userCount} participant
                          {room.userCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onJoinRoom(room.id)}
                      disabled={isLoading}
                      className="px-3 py-1 text-xs rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
  activeSpeakerId: string | null;
  currentUserId: string;
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
  activeSpeakerId,
  currentUserId,
  audioOutputDeviceId,
}: PresentationLayoutProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const isLocalActiveSpeaker = activeSpeakerId === currentUserId;

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
        <div
          className={`relative bg-[#252525] border border-white/5 rounded-lg overflow-hidden h-36 shrink-0 transition-all duration-200 ${getSpeakerHighlightClasses(
            isLocalActiveSpeaker
          )}`}
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
            isActiveSpeaker={activeSpeakerId === participant.userId}
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
  activeSpeakerId: string | null;
  currentUserId: string;
  audioOutputDeviceId?: string;
  isAdmin?: boolean;
  selectedParticipantId?: string | null;
  onParticipantClick?: (userId: string) => void;
}

function GridLayout({
  localStream,
  isCameraOff,
  isMuted,
  participants,
  userEmail,
  isMirrorCamera,
  activeSpeakerId,
  currentUserId,
  audioOutputDeviceId,
  isAdmin = false,
  selectedParticipantId,
  onParticipantClick,
}: GridLayoutProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const isLocalActiveSpeaker = activeSpeakerId === currentUserId;

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
      <div
        className={`relative bg-[#111] border border-white/10 rounded-lg overflow-hidden transition-all duration-200 ${getSpeakerHighlightClasses(
          isLocalActiveSpeaker
        )}`}
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
          isActiveSpeaker={activeSpeakerId === participant.userId}
          audioOutputDeviceId={audioOutputDeviceId}
          isAdmin={isAdmin}
          isSelected={selectedParticipantId === participant.userId}
          onAdminClick={onParticipantClick}
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
  reactionOptions: ReactionOption[];
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onSendReaction: (reaction: ReactionOption) => void;
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
  reactionOptions,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onSendReaction,
  onLeave,
  isAdmin,
  isParticipantsOpen,
  onToggleParticipants,
}: ControlsBarProps) {
  const canStartScreenShare = !activeScreenShareId || isScreenSharing;
  const [isReactionMenuOpen, setIsReactionMenuOpen] = useState(false);
  const reactionMenuRef = useRef<HTMLDivElement>(null);
  const lastReactionTimeRef = useRef<number>(0);
  const REACTION_COOLDOWN_MS = 150; // Prevent rapid-fire reactions

  useEffect(() => {
    if (!isReactionMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        reactionMenuRef.current &&
        !reactionMenuRef.current.contains(event.target as Node)
      ) {
        setIsReactionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isReactionMenuOpen]);

  const handleReactionClick = useCallback(
    (reaction: ReactionOption) => {
      const now = Date.now();
      if (now - lastReactionTimeRef.current < REACTION_COOLDOWN_MS) {
        return; // Throttle rapid clicks
      }
      lastReactionTimeRef.current = now;
      onSendReaction(reaction);
    },
    [onSendReaction]
  );

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

      <div ref={reactionMenuRef} className="relative">
        <button
          onClick={() => setIsReactionMenuOpen((prev) => !prev)}
          className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center ${
            isReactionMenuOpen
              ? "bg-white text-black hover:bg-neutral-200"
              : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
          }`}
          title="Reactions"
        >
          <Smile className="w-5 h-5" />
        </button>

        {isReactionMenuOpen && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-white/10 bg-[#1f1f1f] px-2 py-1 shadow-lg max-w-[320px] overflow-x-auto no-scrollbar">
            {reactionOptions.map((reaction) => (
              <button
                key={reaction.id}
                onClick={() => handleReactionClick(reaction)}
                className="w-9 h-9 shrink-0 rounded-full text-xl hover:bg-white/10 transition-colors flex items-center justify-center"
                title={`React ${reaction.label}`}
              >
                {reaction.kind === "emoji" ? (
                  reaction.value
                ) : (
                  <img
                    src={reaction.value}
                    alt={reaction.label}
                    className="w-6 h-6 object-contain"
                    loading="lazy"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

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

interface ReactionOverlayProps {
  reactions: ReactionEvent[];
}

function ReactionOverlay({ reactions }: ReactionOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {reactions.map((reaction) => {
        const displayName = getDisplayName(reaction.userId);
        return (
          <div
            key={reaction.id}
            className="absolute bottom-20 animate-reaction-float"
            style={{ left: `${reaction.lane}%` }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-16 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-3xl shadow-xl">
                {reaction.kind === "emoji" ? (
                  reaction.value
                ) : (
                  <img
                    src={reaction.value}
                    alt={reaction.label || "Reaction"}
                    className="w-10 h-10 object-contain"
                  />
                )}
              </div>
              <span className="text-[10px] text-white/70 bg-black/40 border border-white/5 px-2 py-0.5 rounded-full">
                {displayName}
              </span>
            </div>
          </div>
        );
      })}
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 64;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom <= threshold;
  };

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
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center text-sm">No messages yet</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.userId === currentUserId;
            const displayName = formatDisplayName(msg.displayName || msg.userId);
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
                      {displayName}
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
  isActiveSpeaker?: boolean;
  audioOutputDeviceId?: string;
  isAdmin?: boolean;
  isSelected?: boolean;
  onAdminClick?: (userId: string) => void;
}

function ParticipantVideo({
  participant,
  compact = false,
  isActiveSpeaker = false,
  audioOutputDeviceId,
  isAdmin = false,
  isSelected = false,
  onAdminClick,
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

  const handleClick = () => {
    if (isAdmin && onAdminClick) {
      onAdminClick(participant.userId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative bg-[#111] border rounded-lg overflow-hidden ${
        compact ? "h-36 shrink-0" : "w-full h-full"
      } ${
        isNew
          ? "animate-participant-join"
          : participant.isLeaving
          ? "animate-participant-leave"
          : ""
      } transition-all duration-200 ${getSpeakerHighlightClasses(
        isActiveSpeaker
      )} border-white/10 ${isAdmin && onAdminClick ? "cursor-pointer hover:border-white/20" : ""}`}
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
      {/* Admin indicator */}
      {isAdmin && onAdminClick && (
        <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full transition-opacity">
          <Info className="w-4 h-4 text-white/70" />
        </div>
      )}
    </div>
  );
}

interface ParticipantsPanelProps {
  participants: Map<string, Participant>;
  currentUserId: string;
  onClose: () => void;
  pendingUsers?: Map<string, string>;
  roomId: string;
  onPendingUserStale?: (userId: string) => void;
}

function ParticipantsPanel({
  participants,
  currentUserId,
  onClose,
  socket,
  isAdmin,
  pendingUsers,
  roomId,
  onPendingUserStale,
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
  const [isPendingExpanded, setIsPendingExpanded] = useState(true);
  const filteredRooms = availableRooms.filter((room) => room.id !== roomId);

  // Helper to extract email from userId (email#sessionId format)
  const getEmailFromUserId = (userId: string): string => {
    return userId.split("#")[0] || userId;
  };

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
      className="absolute right-4 top-4 bottom-20 w-80 bg-[#1f1f1f] rounded-lg shadow-2xl flex flex-col border border-white/5 z-10 overflow-hidden"
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
        <div className="border-b border-white/10 bg-blue-500/10">
          <button
            type="button"
            onClick={() => setIsPendingExpanded((prev) => !prev)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-blue-500/5 transition-colors"
            aria-expanded={isPendingExpanded}
          >
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs text-blue-400 uppercase tracking-wide">
                Pending Requests
              </h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 tabular-nums">
                {pendingList.length}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-blue-200 transition-transform ${
                isPendingExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
          {isPendingExpanded && (
            <div className="px-3 pb-3">
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {pendingList.map(([userId, displayName]) => {
                  const pendingName = formatDisplayName(displayName || userId);
                  return (
                    <div
                      key={userId}
                      className="relative flex items-center justify-between p-2 rounded bg-black/40 border border-white/10"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] border border-white/10 shrink-0">
                          {pendingName[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="text-sm truncate text-white/80">
                          {pendingName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            socket?.emit(
                              "admitUser",
                              { userId },
                              (res: { success?: boolean; error?: string }) => {
                                if (res?.error) {
                                  console.error(
                                    "[Meets] Admit failed:",
                                    res.error
                                  );
                                  onPendingUserStale?.(userId);
                                }
                              }
                            )
                          }
                          className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded transition-colors text-xs font-medium"
                          title="Admit"
                        >
                          Admit
                        </button>
                        <button
                          onClick={() =>
                            socket?.emit(
                              "rejectUser",
                              { userId },
                              (res: { success?: boolean; error?: string }) => {
                                if (res?.error) {
                                  console.error(
                                    "[Meets] Reject failed:",
                                    res.error
                                  );
                                  onPendingUserStale?.(userId);
                                }
                              }
                            )
                          }
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded transition-colors text-xs font-medium"
                          title="Reject"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {participantsList.map((p) => {
          const isMe = p.userId === currentUserId;
          const displayName = getDisplayName(p.userId);
          const userEmail = getEmailFromUserId(p.userId);

          return (
            <div
              key={p.userId}
              className={`relative flex items-center justify-between p-2 rounded-lg border ${
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

// ============================================
// Admin Actions Sidebar (Main UI Integration)
// ============================================

interface AdminActionsSidebarProps {
  participantUserId: string;
  participants: Map<string, Participant>;
  onClose: () => void;
}

function AdminActionsSidebar({
  participantUserId,
  participants,
  onClose,
}: AdminActionsSidebarProps) {
  const [userDetails, setUserDetails] = useState<MeetingUserDetails | null>(
    null
  );
  const [comments, setComments] = useState<
    { id: string; comment: string; by: string; time: Date }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "actions" | "comments" | "form">(
    "actions"
  );

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Task modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskRoundUserId, setTaskRoundUserId] = useState<string | null>(null);
  const [taskDomain, setTaskDomain] = useState<string | null>(null);
  const [taskText, setTaskText] = useState("");
  const [taskDeadline, setTaskDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0); // Default to end of day
    // Format as local datetime for datetime-local input
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null); // For editing existing tasks

  // Comment modal states
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentDomain, setCommentDomain] = useState<string>("");

  // Form submissions state
  const [formSubmissions, setFormSubmissions] = useState<UserFormSubmission[]>([]);
  const [selectedFormSubmission, setSelectedFormSubmission] = useState<UserFormSubmission | null>(null);

  // Extract email from userId
  const email = participantUserId.split("#")[0] || participantUserId;
  const participant = participants.get(participantUserId);
  const displayName = participant
    ? getDisplayName(participant.userId)
    : email.split("@")[0];

  // Load user details - single optimized query
  useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getMeetingUserFullData(email);

        if (cancelled) return;

        if (data) {
          setUserDetails(data.userDetails);
          setComments(data.comments);
          setFormSubmissions(data.formSubmissions);
          
          if (data.userDetails.roundUsers.length > 0) {
            setCommentDomain(data.userDetails.roundUsers[0].round.domain);
          }
        } else {
          setError("User not found in system");
        }
      } catch (err) {
        if (cancelled) return;
        setError("Failed to load details");
        console.error("[AdminActionsSidebar] Error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [email]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showTaskModal) {
          setShowTaskModal(false);
        } else if (showCommentModal) {
          setShowCommentModal(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, showTaskModal, showCommentModal]);

  useEffect(() => {
    if (actionSuccess || actionError) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess, actionError]);

  const refreshUserDetails = async () => {
    if (!userDetails) return;
    
    try {
      const data = await getMeetingUserFullData(email);
      if (data) {
        setUserDetails(data.userDetails);
        setComments(data.comments);
        setFormSubmissions(data.formSubmissions);
      }
    } catch (err) {
      console.error("[AdminActionsSidebar] Refresh error:", err);
    }
  };

  const handleVerifyAttendance = async (roundUser: MeetingRoundUser) => {
    setActionLoading(`verify-${roundUser.id}`);
    setActionError(null);

    const result = await verifyMeetingAttendance(roundUser.id);

    setActionLoading(null);
    if (result.success) {
      setActionSuccess(`Attendance verified for ${roundUser.round.domain}`);
      await refreshUserDetails();
    } else {
      setActionError(result.error || "Failed to verify attendance");
    }
  };

  const handlePromote = async (roundUser: MeetingRoundUser) => {
    setActionLoading(`promote-${roundUser.id}`);
    setActionError(null);

    const result = await promoteMeetingUser(roundUser.id);

    setActionLoading(null);
    if (result.success) {
      setActionSuccess(`Promoted in ${roundUser.round.domain}`);
      await refreshUserDetails();
    } else {
      setActionError(result.error || "Failed to promote user");
    }
  };

  const handleReject = async (roundUser: MeetingRoundUser) => {
    setActionLoading(`reject-${roundUser.id}`);
    setActionError(null);

    const result = await rejectMeetingUser(roundUser.id);

    setActionLoading(null);
    if (result.success) {
      setActionSuccess(`Rejected from ${roundUser.round.domain}`);
      await refreshUserDetails();
    } else {
      setActionError(result.error || "Failed to reject user");
    }
  };

  const openTaskModal = (roundUserId: string, domain: string, existingTask?: { id: string; text: string; deadline: Date }) => {
    setTaskRoundUserId(roundUserId);
    setTaskDomain(domain);
    if (existingTask) {
      // Editing existing task
      setEditingTaskId(existingTask.id);
      setTaskText(existingTask.text);
      // Format existing deadline for datetime-local input
      const d = new Date(existingTask.deadline);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      setTaskDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      // New task
      setEditingTaskId(null);
      setTaskText("");
      // Reset to default deadline (4 days from now)
      const d = new Date();
      d.setDate(d.getDate() + 4);
      d.setHours(23, 59, 0, 0);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      setTaskDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
    setShowTaskModal(true);
  };

  const handleAssignTask = async () => {
    if (!taskRoundUserId || !taskText.trim()) return;

    setActionLoading("task");
    setActionError(null);

    const result = await assignMeetingTask(
      taskRoundUserId,
      taskText.trim(),
      new Date(taskDeadline)
    );

    setActionLoading(null);
    if (result.success) {
      setActionSuccess("Task assigned & promoted");
      setShowTaskModal(false);
      setTaskRoundUserId(null);
      setTaskDomain(null);
      setTaskText("");
      setEditingTaskId(null);
      await refreshUserDetails();
    } else {
      setActionError(result.error || "Failed to assign task");
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTaskId || !taskText.trim()) return;

    setActionLoading("task");
    setActionError(null);

    const result = await updateMeetingTask(
      editingTaskId,
      taskText.trim(),
      new Date(taskDeadline)
    );

    setActionLoading(null);
    if (result.success) {
      setActionSuccess("Task updated");
      setShowTaskModal(false);
      setTaskRoundUserId(null);
      setTaskDomain(null);
      setTaskText("");
      setEditingTaskId(null);
      await refreshUserDetails();
    } else {
      setActionError(result.error || "Failed to update task");
    }
  };

  const handleAddComment = async () => {
    if (!userDetails || !commentText.trim() || !commentDomain) return;

    setActionLoading("comment");
    setActionError(null);

    const result = await addMeetingComment(
      userDetails.id,
      commentDomain,
      commentText.trim()
    );

    setActionLoading(null);
    if (result.success) {
      setActionSuccess("Comment added");
      setShowCommentModal(false);
      setCommentText("");
      await refreshUserDetails();
    } else {
      setActionError(result.error || "Failed to add comment");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "promoted":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "rejected":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "evaluate":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "pending":
      default:
        return "text-neutral-400 bg-neutral-500/10 border-neutral-500/20";
    }
  };

  const getDomainColor = (domain: string) => {
    switch (domain.toLowerCase()) {
      case "tech":
        return "text-blue-400";
      case "design":
        return "text-pink-400";
      case "management":
        return "text-amber-400";
      case "research":
        return "text-purple-400";
      case "cc":
        return "text-cyan-400";
      default:
        return "text-neutral-400";
    }
  };

  const formatDomain = (domain: string) => {
    if (domain.toLowerCase() === "cc") return "CC";
    return domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();
  };

  const uniqueDomains = useMemo(() => {
    if (!userDetails?.roundUsers) return [];
    return [...new Set(userDetails.roundUsers.map((ru) => ru.round.domain))];
  }, [userDetails?.roundUsers]);

  // Get interview and task rounds (actionable rounds)
  const actionableRounds = useMemo(() => {
    if (!userDetails?.roundUsers) return [];
    return userDetails.roundUsers.filter(
      (ru) => ru.round.type === "interview" || ru.round.type === "task"
    );
  }, [userDetails?.roundUsers]);

  return (
    <>
      <div
        className="absolute right-2 sm:right-4 top-2 sm:top-4 bottom-16 sm:bottom-20 w-[calc(100%-1rem)] sm:w-80 md:w-96 bg-[#1f1f1f] rounded-lg shadow-2xl flex flex-col border border-white/5 z-20 animate-in slide-in-from-right-4 duration-200"
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 p-3 border-b border-white/5 shrink-0">
          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-sm font-medium shrink-0">
            {displayName[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {userDetails?.name || displayName}
            </h3>
            <p className="text-[10px] text-neutral-500 truncate">{email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded transition-colors text-neutral-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action feedback */}
        {(actionSuccess || actionError) && (
          <div
            className={`mx-3 mt-2 px-2.5 py-1.5 rounded text-[11px] flex items-center gap-1.5 ${
              actionSuccess
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {actionSuccess ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            <span className="truncate">{actionSuccess || actionError}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/5 shrink-0">
          {(["actions", "form", "info", "comments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-[10px] font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "text-white border-b-2 border-blue-500"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {tab === "form" ? "Form" : tab}
              {tab === "comments" && ` (${comments.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
              <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
              <p className="text-xs">{error}</p>
            </div>
          ) : activeTab === "actions" ? (
            // Actions tab - Quick actions for interview/task rounds
            <div className="space-y-2">
              {actionableRounds.length === 0 ? (
                <div className="text-center py-6 text-neutral-500">
                  <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No enrollments found</p>
                </div>
              ) : (
                actionableRounds.map((ru) => (
                  <div
                    key={ru.id}
                    className="p-3 bg-[#252525] rounded-lg border border-white/5"
                  >
                    {/* Domain header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold ${getDomainColor(ru.round.domain)}`}
                        >
                          {formatDomain(ru.round.domain)}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          R{ru.round.number} • {ru.round.type === "task" ? "Task" : "Interview"}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full border capitalize ${getStatusColor(ru.status)}`}
                      >
                        {ru.status}
                      </span>
                    </div>

                    {/* Meeting slot info */}
                    {ru.Meet_User && (
                      <div className="flex items-center gap-1 text-[10px] text-blue-400 mb-2">
                        <Calendar className="w-3 h-3" />
                        Meeting slot booked
                      </div>
                    )}

                    {/* Task info - clickable to edit */}
                    {ru.Task && (
                      <button
                        onClick={() => openTaskModal(ru.id, ru.round.domain, {
                          id: ru.Task!.id,
                          text: ru.Task!.text,
                          deadline: ru.Task!.deadline,
                        })}
                        className="w-full text-left mb-2 p-2 bg-green-500/10 hover:bg-green-500/20 rounded border border-green-500/20 hover:border-green-500/30 transition-colors group"
                      >
                        <div className="flex items-center justify-between text-green-400 text-[10px] mb-1">
                          <div className="flex items-center gap-1">
                            <ClipboardList className="w-3 h-3" />
                            <span className="font-medium">Task Assigned</span>
                          </div>
                          <span className="text-[9px] text-neutral-500 group-hover:text-green-400 transition-colors">Edit</span>
                        </div>
                        <p className="text-[10px] text-neutral-300 line-clamp-2">
                          {ru.Task.text}
                        </p>
                        <p className="text-[9px] text-neutral-500 mt-1">
                          Due: {new Date(ru.Task.deadline).toLocaleString()}
                        </p>
                      </button>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {/* Verify Attendance - interview rounds only */}
                      {ru.round.type === "interview" && ru.status === "pending" && (
                        <button
                          onClick={() => handleVerifyAttendance(ru)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1 text-[10px] px-2 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded border border-yellow-500/20 transition-colors disabled:opacity-50 font-medium"
                        >
                          {actionLoading === `verify-${ru.id}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserCheck className="w-3 h-3" />
                          )}
                          Verify Attendance
                        </button>
                      )}

                      {/* Assign Task & Promote - interview rounds only, not for management */}
                      {ru.round.type === "interview" && ru.status === "evaluate" && !ru.Task && ru.round.domain !== "management" && (
                        <button
                          onClick={() => openTaskModal(ru.id, ru.round.domain)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1 text-[10px] px-2 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded border border-green-500/30 transition-colors disabled:opacity-50 font-medium"
                        >
                          <ClipboardList className="w-3 h-3" />
                          Assign Task & Promote
                        </button>
                      )}

                      {/* Reject - interview rounds only */}
                      {ru.round.type === "interview" && (ru.status === "pending" || ru.status === "evaluate") && (
                        <button
                          onClick={() => handleReject(ru)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1 text-[10px] px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 transition-colors disabled:opacity-50 font-medium"
                        >
                          {actionLoading === `reject-${ru.id}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserX className="w-3 h-3" />
                          )}
                          Reject
                        </button>
                      )}

                      {/* Already promoted - interview rounds */}
                      {ru.round.type === "interview" && ru.status === "promoted" && (
                        <div className="flex items-center gap-1 text-[10px] text-green-400">
                          <Check className="w-3 h-3" />
                          Promoted
                        </div>
                      )}

                      {/* Already rejected - interview rounds */}
                      {ru.round.type === "interview" && ru.status === "rejected" && (
                        <div className="flex items-center gap-1 text-[10px] text-red-400">
                          <X className="w-3 h-3" />
                          Rejected
                        </div>
                      )}

                      {/* Task round status */}
                      {ru.round.type === "task" && (
                        <div className={`flex items-center gap-1 text-[10px] ${
                          ru.status === "pending" ? "text-yellow-400" : 
                          ru.status === "promoted" ? "text-green-400" : 
                          ru.status === "rejected" ? "text-red-400" : "text-neutral-400"
                        }`}>
                          {ru.status === "pending" ? (
                            <>
                              <ClipboardList className="w-3 h-3" />
                              Task Pending
                            </>
                          ) : ru.status === "promoted" ? (
                            <>
                              <Check className="w-3 h-3" />
                              Task Completed
                            </>
                          ) : ru.status === "rejected" ? (
                            <>
                              <X className="w-3 h-3" />
                              Task Failed
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === "info" ? (
            // Info tab - All domain enrollments
            <div className="space-y-2">
              {userDetails?.phone && (
                <div className="flex items-center gap-2 text-xs text-neutral-400 p-2 bg-[#252525] rounded border border-white/5">
                  <Phone className="w-3.5 h-3.5" />
                  {userDetails.phone}
                </div>
              )}
              {userDetails?.roundUsers.length === 0 ? (
                <div className="text-center py-6 text-neutral-500">
                  <p className="text-xs">No domain enrollments</p>
                </div>
              ) : (
                userDetails?.roundUsers.map((ru) => (
                  <div
                    key={ru.id}
                    className="flex items-center justify-between p-2 bg-[#252525] rounded border border-white/5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-medium ${getDomainColor(ru.round.domain)}`}
                      >
                        {formatDomain(ru.round.domain)}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        R{ru.round.number} · {ru.round.type}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full border capitalize ${getStatusColor(ru.status)}`}
                    >
                      {ru.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === "form" ? (
            // Form Submissions tab - inline expandable
            <div className="space-y-2">
              {formSubmissions.length === 0 ? (
                <div className="text-center py-6 text-neutral-500">
                  <ClipboardList className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No form submissions</p>
                </div>
              ) : (
                formSubmissions.map((fs) => (
                  <div key={fs.id} className="bg-[#252525] rounded border border-white/5 overflow-hidden">
                    <button
                      className="w-full p-2 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors text-left"
                      onClick={() => {
                        setSelectedFormSubmission(selectedFormSubmission?.id === fs.id ? null : fs);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${getDomainColor(fs.round.domain)}`}>
                          {formatDomain(fs.round.domain)}
                        </span>
                        <span className="text-[9px] text-neutral-500">
                          R{fs.round.number} · {fs.responses.length} Q&A
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${
                        selectedFormSubmission?.id === fs.id ? "rotate-180" : ""
                      }`} />
                    </button>
                    {selectedFormSubmission?.id === fs.id && (
                      <div className="border-t border-white/5 p-2 space-y-2 max-h-[300px] overflow-y-auto">
                        {fs.responses.length === 0 ? (
                          <p className="text-[10px] text-neutral-500 text-center py-2">No responses</p>
                        ) : (
                          fs.responses.map((response, idx) => (
                            <div key={response.id} className="p-2 bg-[#1f1f1f] rounded border border-white/5">
                              <p className="text-[10px] font-medium text-neutral-400 mb-1">
                                Q{idx + 1}: {response.question?.question || 'Unknown question'}
                              </p>
                              <p className="text-[11px] text-white whitespace-pre-wrap">
                                {response.response || <span className="text-neutral-500 italic">No response</span>}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            // Comments tab
            <div className="space-y-2">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-neutral-500">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No comments yet</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-2 bg-[#252525] rounded border border-white/5"
                  >
                    <p className="text-xs text-neutral-300">{c.comment}</p>
                    <p className="text-[9px] text-neutral-500 mt-1.5">
                      {c.by} ·{" "}
                      {new Date(c.time).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Add Comment Button */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <button
            onClick={() => setShowCommentModal(true)}
            className="w-full flex items-center justify-center gap-1.5 text-xs py-2 bg-white/5 hover:bg-white/10 text-neutral-300 rounded border border-white/5 transition-colors font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Add Comment
          </button>
        </div>
      </div>

      {/* Task Assignment Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[#1f1f1f] border border-white/10 rounded-lg w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200"
            style={{ fontFamily: "'Roboto', sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-white/5">
              <h3 className="text-xs font-semibold text-white">
                {editingTaskId ? "Edit Task" : "Assign Task & Promote"}
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">
                  Task Description
                </label>
                <textarea
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  placeholder="Describe the task..."
                  className="w-full bg-[#252525] border border-white/5 rounded px-2.5 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">
                  Deadline (your local time)
                </label>
                <input
                  type="datetime-local"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="w-full bg-[#252525] border border-white/5 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="flex gap-2 p-3 border-t border-white/5">
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 py-2 text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingTaskId ? handleUpdateTask : handleAssignTask}
                disabled={!taskText.trim() || actionLoading === "task"}
                className="flex-1 py-2 text-xs text-white bg-green-600 hover:bg-green-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {actionLoading === "task" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ClipboardList className="w-3 h-3" />
                )}
                {editingTaskId ? "Update Task" : "Assign & Promote"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[#1f1f1f] border border-white/10 rounded-lg w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200"
            style={{ fontFamily: "'Roboto', sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-white/5">
              <h3 className="text-xs font-semibold text-white">Add Comment</h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">
                  Domain
                </label>
                <select
                  value={commentDomain}
                  onChange={(e) => setCommentDomain(e.target.value)}
                  className="w-full bg-[#252525] border border-white/5 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                >
                  {uniqueDomains.map((d) => (
                    <option key={d} value={d} className="bg-[#1f1f1f]">
                      {formatDomain(d)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">
                  Comment
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write your comment..."
                  className="w-full bg-[#252525] border border-white/5 rounded px-2.5 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 p-3 border-t border-white/5">
              <button
                onClick={() => setShowCommentModal(false)}
                className="flex-1 py-2 text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={
                  !commentText.trim() ||
                  !commentDomain ||
                  actionLoading === "comment"
                }
                className="flex-1 py-2 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {actionLoading === "comment" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <MessageSquare className="w-3 h-3" />
                )}
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
