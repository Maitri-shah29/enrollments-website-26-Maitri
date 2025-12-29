"use client";

import { useEffect, useRef, useState, useCallback, useReducer } from "react";
import { io, Socket } from "socket.io-client";
import { Device } from "mediasoup-client";
import type {
  Transport,
  Producer,
  Consumer,
  RtpCapabilities,
} from "mediasoup-client/types";
import { useSessionContext } from "../components/session-provider";
import {
  Monitor,
  Phone,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Loader2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import { getSfuToken } from "../actions/sfu-token";

// ============================================
// Configuration
// ============================================

const SFU_URL = process.env.NEXT_PUBLIC_SFU_URL || "https://localhost:3031";
const RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_ATTEMPTS = 5;
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
  isMuted: boolean;
  isCameraOff: boolean;
}

/** Producer info from server */
interface ProducerInfo {
  producerId: string;
  producerUserId: string;
  kind: "audio" | "video";
  type: ProducerType;
}

/** Socket response types */
interface JoinRoomResponse {
  rtpCapabilities: RtpCapabilities;
  existingProducers: ProducerInfo[];
}

interface TransportResponse {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
}

interface ConsumeResponse {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: any;
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
  | {
      type: "UPDATE_STREAM";
      userId: string;
      kind: "audio" | "video";
      streamType: ProducerType;
      stream: MediaStream | null;
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
    case "UPDATE_STREAM": {
      const participant = newState.get(action.userId) || {
        userId: action.userId,
        videoStream: null,
        audioStream: null,
        screenShareStream: null,
        isMuted: false,
        isCameraOff: false,
      };

      if (action.streamType === "screen") {
        participant.screenShareStream = action.stream;
      } else if (action.kind === "video") {
        participant.videoStream = action.stream;
      } else if (action.kind === "audio") {
        participant.audioStream = action.stream;
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

export default function MeetsClient() {
  const { session } = useSessionContext();
  const [mounted, setMounted] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [roomId, setRoomId] = useState("default-room");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
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
  const [mediaState, setMediaState] = useState<MediaState>({
    hasAudioPermission: false,
    hasVideoPermission: false,
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatInput, setChatInput] = useState("");

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
  const currentRoomIdRef = useRef<string | null>(null);

  // Generate stable session ID per component instance
  const sessionIdRef = useRef<string>(generateSessionId());
  const userEmail = session?.data?.user?.name || "guest";
  const userId = `${userEmail}#${sessionIdRef.current}`;

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

  const cleanup = useCallback(() => {
    console.log("[Meets] Running cleanup...");

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
    dispatchParticipants({ type: "CLEAR_ALL" });
    setIsScreenSharing(false);
    setActiveScreenShareId(null);
    currentRoomIdRef.current = null;
    reconnectAttemptsRef.current = 0;
  }, [localStream]);

  // ============================================
  // Socket Connection with Reconnection
  // ============================================

  const connectSocket = useCallback((): Promise<Socket> => {
    return new Promise(async (resolve, reject) => {
      if (socketRef.current?.connected) {
        resolve(socketRef.current);
        return;
      }

      setConnectionState("connecting");

      try {
        const token = await getSfuToken();

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
          resolve(socket);
        });

        socket.on("disconnect", (reason) => {
          console.log("[Meets] Disconnected:", reason);
          if (
            reason === "io server disconnect" ||
            reason === "io client disconnect"
          ) {
            setConnectionState("disconnected");
          } else if (currentRoomIdRef.current) {
            // Unexpected disconnect during active session
            handleReconnect();
          }
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

        socket.on("userLeft", ({ userId: leftUserId }: { userId: string }) => {
          console.log("[Meets] User left:", leftUserId);
          dispatchParticipants({
            type: "REMOVE_PARTICIPANT",
            userId: leftUserId,
          });

          // Clear screen share if the presenter left
          for (const [producerId, info] of producerMapRef.current) {
            if (info.userId === leftUserId && info.type === "screen") {
              setActiveScreenShareId(null);
              producerMapRef.current.delete(producerId);
            }
          }
        });

        // Media state events
        socket.on(
          "participantMuted",
          ({ oderId, muted }: { oderId: string; muted: boolean }) => {
            dispatchParticipants({
              type: "UPDATE_MUTED",
              userId: oderId,
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

        // Chat message event
        socket.on("chatMessage", (message: ChatMessage) => {
          console.log("[Meets] Chat message received:", message);
          setChatMessages((prev) => [...prev, message]);
          // Increment unread count if chat is closed
          if (!isChatOpen) {
            setUnreadCount((prev) => prev + 1);
          }
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
    const delay =
      RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current - 1);

    console.log(
      `[Meets] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`
    );
    await new Promise((r) => setTimeout(r, delay));

    try {
      socketRef.current?.disconnect();
      socketRef.current = null;
      await connectSocket();

      // Rejoin room if we were in one
      if (currentRoomIdRef.current && localStream) {
        await joinRoomInternal(currentRoomIdRef.current, localStream);
      }
    } catch (err) {
      handleReconnect();
    }
  }, [connectSocket, localStream]);

  const handleProducerClosed = useCallback((producerId: string) => {
    const consumer = consumersRef.current.get(producerId);
    if (consumer) {
      try {
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
      });

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
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 360, max: 720 },
            frameRate: { ideal: 24, max: 30 },
          },
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

        // Try audio-only if video fails
        if (
          meetErr.code === "PERMISSION_DENIED" ||
          meetErr.code === "MEDIA_ERROR"
        ) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
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
    }, []);

  // ============================================
  // Room Join Flow
  // ============================================

  const joinRoom = useCallback(async () => {
    if (abortControllerRef.current?.signal.aborted) return;

    setMeetError(null);
    setConnectionState("connecting");

    try {
      // Get media first
      const stream = await requestMediaPermissions();
      if (!stream) {
        setConnectionState("error");
        return;
      }
      setLocalStream(stream);

      // Connect socket
      const socket = await connectSocket();

      // Join room
      await joinRoomInternal(roomId, stream);
    } catch (err) {
      console.error("[Meets] Error joining room:", err);
      setMeetError(createMeetError(err));
      setConnectionState("error");
    }
  }, [roomId, connectSocket, requestMediaPermissions]);

  const joinRoomInternal = useCallback(
    async (targetRoomId: string, stream: MediaStream) => {
      const socket = socketRef.current;
      if (!socket) throw new Error("Socket not connected");

      setConnectionState("joining");

      return new Promise<void>((resolve, reject) => {
        socket.emit(
          "joinRoom",
          { roomId: targetRoomId, userId },
          async (response: JoinRoomResponse | { error: string }) => {
            if ("error" in response) {
              reject(new Error(response.error));
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
    [userId]
  );

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

  const produce = useCallback(async (stream: MediaStream): Promise<void> => {
    const transport = producerTransportRef.current;
    if (!transport) return;

    // Produce audio
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      try {
        const audioProducer = await transport.produce({
          track: audioTrack,
          appData: { type: "webcam" as ProducerType },
        });
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
          appData: { type: "webcam" as ProducerType },
        });
        videoProducerRef.current = videoProducer;

        videoProducer.on("transportclose", () => {
          videoProducerRef.current = null;
        });
      } catch (err) {
        console.error("[Meets] Failed to produce video:", err);
      }
    }
  }, []);

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
              });

              if (producerInfo.type === "screen") {
                setActiveScreenShareId(producerInfo.producerId);
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
  // Media Controls
  // ============================================

  const toggleMute = useCallback(() => {
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
    }
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
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
    }
  }, [isCameraOff]);

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
          setChatMessages((prev) => [...prev, response.message!]);
        }
      }
    );
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      if (!prev) {
        // Opening chat, clear unread
        setUnreadCount(0);
      }
      return !prev;
    });
  }, []);

  // ============================================
  // Local Video Ref Callback
  // ============================================

  const setLocalVideoRef = useCallback(
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
    connectionState === "reconnecting";

  return (
    <div className="flex flex-col h-full w-full bg-black text-white font-[family-name:var(--font-geist-mono)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">ACM c0nclav3</h1>
        <div className="flex items-center gap-3">
          {isScreenSharing && (
            <span className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-2 py-0.5 rounded-full animate-pulse">
              REC
            </span>
          )}
          {connectionState === "reconnecting" && (
            <span className="bg-yellow-600 text-xs px-2 py-1 rounded flex items-center gap-1">
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
          />
        ) : isPresentationMode ? (
          /* Presentation Layout */
          <PresentationLayout
            presentationStream={presentationStream!}
            presenterName={presenterName}
            localStream={localStream}
            isCameraOff={isCameraOff}
            participants={participants}
            userEmail={userEmail}
          />
        ) : (
          /* Grid Layout */
          <GridLayout
            localStream={localStream}
            isCameraOff={isCameraOff}
            isMuted={isMuted}
            participants={participants}
            userEmail={userEmail}
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
    error: "bg-red-500",
  };

  const labels: Record<ConnectionState, string> = {
    disconnected: "Disconnected",
    connecting: "Connecting...",
    connected: "Connected",
    joining: "Joining...",
    joined: "In Meeting",
    reconnecting: "Reconnecting...",
    error: "Error",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${colors[state]}`} />
      <span className="text-xs text-neutral-500 uppercase tracking-wider">
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
}

function JoinScreen({
  roomId,
  onRoomIdChange,
  onJoin,
  isLoading,
  userEmail,
  connectionState,
}: JoinScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2">Join a Meeting</h2>
        <p className="text-gray-400">Logged in as: {userEmail}</p>
      </div>

      <input
        type="text"
        value={roomId}
        onChange={(e) => onRoomIdChange(e.target.value)}
        placeholder="Enter Room ID"
        disabled={isLoading}
        className="px-4 py-2 bg-[#111] border border-white/10 rounded-md w-64 text-center focus:outline-none focus:border-white transition-colors disabled:opacity-50 placeholder:text-neutral-600"
      />

      <button
        onClick={onJoin}
        disabled={isLoading || !roomId.trim()}
        className="px-6 py-2 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed rounded-md font-medium transition-colors flex items-center gap-2 text-sm"
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
}

function PresentationLayout({
  presentationStream,
  presenterName,
  localStream,
  isCameraOff,
  participants,
  userEmail,
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
      <div className="flex-1 bg-[#111] border border-white/10 rounded-lg overflow-hidden relative flex items-center justify-center">
        <video
          ref={(el) => {
            if (el && presentationStream) el.srcObject = presentationStream;
          }}
          autoPlay
          playsInline
          className="max-w-full max-h-full"
        />
        <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
          {presenterName} is presenting
        </div>
      </div>

      {/* Sidebar Participants - scrollable with fixed-height tiles */}
      <div className="w-64 flex flex-col gap-3 overflow-y-auto pr-1">
        {/* Local User */}
        <div className="relative bg-[#111] border border-white/10 rounded-lg overflow-hidden h-36 shrink-0">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${
              isCameraOff ? "hidden" : ""
            }`}
          />
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
              <div className="w-10 h-10 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-lg">
                {userEmail[0]?.toUpperCase() || "?"}
              </div>
            </div>
          )}
          <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/80 border border-white/10 rounded text-xs">
            You
          </div>
        </div>

        {/* Remote Participants */}
        {Array.from(participants.values()).map((participant) => (
          <ParticipantVideo
            key={participant.userId}
            participant={participant}
            compact
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
}

function GridLayout({
  localStream,
  isCameraOff,
  isMuted,
  participants,
  userEmail,
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

  return (
    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-auto">
      {/* Local Video */}
      <div className="relative bg-[#111] border border-white/10 rounded-lg overflow-hidden aspect-video">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${
            isCameraOff ? "hidden" : ""
          }`}
        />
        {isCameraOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
            <div className="w-16 h-16 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-xl">
              {userEmail[0]?.toUpperCase() || "?"}
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 border border-white/10 rounded text-sm flex items-center gap-2">
          You {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
        </div>
      </div>

      {/* Remote Participants */}
      {Array.from(participants.values()).map((participant) => (
        <ParticipantVideo key={participant.userId} participant={participant} />
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
}: ControlsBarProps) {
  const canStartScreenShare = !activeScreenShareId || isScreenSharing;

  return (
    <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-white/10 shrink-0">
      <button
        onClick={onToggleMute}
        className={`p-3 rounded-full transition-all border ${
          isMuted
            ? "bg-red-500 text-white border-red-600"
            : "bg-transparent text-white border-white/10 hover:bg-white/10"
        }`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      <button
        onClick={onToggleCamera}
        className={`p-3 rounded-full transition-all border ${
          isCameraOff
            ? "bg-red-500 text-white border-red-600"
            : "bg-transparent text-white border-white/10 hover:bg-white/10"
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
        className={`p-3 rounded-full transition-all border ${
          isScreenSharing
            ? "bg-white text-black border-white"
            : !canStartScreenShare
            ? "bg-transparent text-neutral-600 border-white/5 cursor-not-allowed"
            : "bg-transparent text-white border-white/10 hover:bg-white/10"
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
        className={`p-3 rounded-full transition-all border relative ${
          isChatOpen
            ? "bg-white text-black border-white"
            : "bg-transparent text-white border-white/10 hover:bg-white/10"
        }`}
        title="Chat"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center border border-black font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <button
        onClick={onLeave}
        className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all border border-red-500 hover:border-red-600"
        title="Leave meeting"
      >
        <Phone className="rotate-[135deg]" />
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
  }, [messages]);

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
    <div className="absolute right-4 top-4 bottom-20 w-80 bg-[#111] rounded-lg shadow-2xl flex flex-col border border-white/10 z-10 font-[family-name:var(--font-geist-mono)]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="font-bold text-sm">Chat</h3>
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
                      : "bg-[#222] text-neutral-200 border border-white/10"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs text-gray-400 mb-1">
                      {msg.displayName}
                    </p>
                  )}
                  <p className="text-sm break-words">{msg.content}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1">
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
        className="p-3 border-t border-white/10 bg-[#111]"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={1000}
            className="flex-1 px-3 py-2 bg-[#222] border border-white/10 rounded-md text-sm focus:outline-none focus:border-white transition-colors placeholder:text-neutral-600"
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
}

function ParticipantVideo({
  participant,
  compact = false,
}: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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
      }
      audioRef.current = node;
    },
    [participant.audioStream]
  );

  const displayName = getDisplayName(participant.userId);
  const showPlaceholder = !participant.videoStream || participant.isCameraOff;

  return (
    <div
      className={`relative bg-[#111] border border-white/10 rounded-lg overflow-hidden shrink-0 ${
        compact ? "h-36" : "aspect-video"
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
        <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
          <div
            className={`rounded-full bg-[#222] border border-white/10 flex items-center justify-center ${
              compact ? "w-10 h-10 text-lg" : "w-16 h-16 text-2xl"
            }`}
          >
            {displayName[0]?.toUpperCase() || "?"}
          </div>
        </div>
      )}
      <audio ref={setAudioRef} autoPlay />
      <div
        className={`absolute bottom-2 left-2 bg-black/80 border border-white/10 rounded px-2 py-0.5 flex items-center gap-2 ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        <span className="font-medium">{displayName}</span>
        {participant.isMuted && <MicOff className="w-3 h-3 text-red-500" />}
      </div>
    </div>
  );
}
