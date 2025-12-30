import express from "express";
import { createServer as createHttpsServer } from "https";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Server as SocketIOServer, Socket } from "socket.io";
import type { Worker } from "mediasoup/types";
import jwt from "jsonwebtoken";

import { config } from "./config/config.js";
import createWorkers from "./utilities/createWorkers.js";
import getWorker from "./utilities/getWorker.js";
import { Room } from "./config/classes/Room.js";
import { Client } from "./config/classes/Client.js";
import { Admin } from "./config/classes/Admin.js";
import type {
  JoinRoomData,
  JoinRoomResponse,
  CreateTransportResponse,
  ConnectTransportData,
  ProduceData,
  ProduceResponse,
  ConsumeData,
  ConsumeResponse,
  ToggleMediaData,
  ProducerInfo,
  SendChatData,
  ChatMessage,
} from "./types.js";

// ============================================
// Global State
// ============================================

let workers: Worker[] = [];
const rooms: Map<string, Room> = new Map();

// ============================================
// Server Setup (HTTPS for WebRTC)
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Load SSL certificates
const httpsOptions = {
  key: readFileSync(join(__dirname, "certs", "cert.key")),
  cert: readFileSync(join(__dirname, "certs", "cert.crt")),
};

const httpsServer = createHttpsServer(httpsOptions, app);

const io = new SocketIOServer(httpsServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//might need to rethink this logic (ask board)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  jwt.verify(token, config.sfuSecret, (err: Error | null, decoded: any) => {
    if (err) {
      return next(new Error("Authentication error: Invalid token"));
    }

    // Explicit, robust check for decoded payload
    if (!decoded || typeof decoded !== "object") {
      return next(new Error("Authentication error: Invalid token payload"));
    }

    // Attach user info to socket if needed
    (socket as any).user = decoded;
    next();
  });
});

// ============================================
// Initialization
// ============================================

const initMediaSoup = async (): Promise<void> => {
  workers = (await createWorkers()) as Worker[];
  console.log(`[SFU] Created ${workers.length} mediasoup workers`);
};

// ============================================
// Helper Functions
// ============================================

const getOrCreateRoom = async (roomId: string): Promise<Room> => {
  let room = rooms.get(roomId);
  if (room) {
    return room;
  }

  // Get the least loaded worker
  const worker = await getWorker(workers);

  // Create a new router for this room
  const router = await worker.createRouter({
    mediaCodecs: config.routerMediaCodecs as any,
  });

  room = new Room({ id: roomId, router });
  rooms.set(roomId, room);
  console.log(`[SFU] Created room: ${roomId}`);

  return room;
};

const cleanupRoom = (roomId: string): void => {
  const room = rooms.get(roomId);
  if (room && room.isEmpty()) {
    room.close();
    rooms.delete(roomId);
    console.log(`[SFU] Closed empty room: ${roomId}`);
  }
};

// ============================================
// Socket.io Connection Handler
// ============================================

io.on("connection", (socket: Socket) => {
  console.log(`[SFU] Client connected: ${socket.id}`);

  let currentRoom: Room | null = null;
  let currentClient: Client | null = null;

  // Rate limiting state
  let lastChatTime = 0;
  const CHAT_RATE_LIMIT_MS = 500;

  // ----------------------------------------
  // Join Room
  // ----------------------------------------
  socket.on(
    "joinRoom",
    async (
      data: JoinRoomData,
      callback: (response: JoinRoomResponse | { error: string }) => void
    ) => {
      try {
        const { roomId, userId } = data;
        const isAdmin = (socket as any).user?.isAdmin;

        // Get or create room
        let room = rooms.get(roomId);

        if (!room) {
          if (!isAdmin && !config.allowNonAdminRoomCreation) {
            callback({ error: "Only admins can create rooms." });
            return;
          }
          // Create room if admin or if allowed by config
          room = await getOrCreateRoom(roomId);
        } else {
          // Room exists, check if cleanup timer is active
          if (isAdmin && room.cleanupTimer) {
            console.log(
              `[SFU] Admin returning to room ${roomId}, cleanup cancelled.`
            );
            room.stopCleanupTimer();
          }
        }
        currentRoom = room;

        // Create client based on role
        if (isAdmin) {
          currentClient = new Admin({ id: userId, socket });
        } else {
          currentClient = new Client({ id: userId, socket });
        }

        currentRoom.addClient(currentClient);

        // Join socket room for broadcasting
        socket.join(roomId);

        // Notify others
        socket.to(roomId).emit("userJoined", { userId });

        // Check for video quality update
        const newQuality = currentRoom.updateVideoQuality();
        if (newQuality) {
          // Quality changed (e.g. threshold crossed) -> Notify EVERYONE
          io.to(roomId).emit("setVideoQuality", { quality: newQuality });
        } else if (currentRoom.currentQuality === "low") {
          // No change, but room is already Low -> Notify NEW user
          socket.emit("setVideoQuality", { quality: "low" });
        }

        // Get existing producers for the new client to consume
        const existingProducers = currentRoom.getAllProducers(userId);

        console.log(
          `[SFU] User ${userId} joined room ${roomId} as ${
            isAdmin ? "Admin" : "Client"
          }`
        );

        // Register Admin listeners
        if (currentClient instanceof Admin) {
          socket.on(
            "kickUser",
            ({ userId: targetId }: { userId: string }, cb) => {
              if (!currentRoom) return;
              const target = currentRoom.getClient(targetId);
              if (target) {
                target.socket.emit("kicked"); // Notify client
                target.socket.disconnect(true);
                cb({ success: true });
              } else {
                cb({ error: "User not found" });
              }
            }
          );

          socket.on("closeRemoteProducer", ({ producerId }, cb) => {
            if (!currentRoom) return;
            for (const client of currentRoom.clients.values()) {
              if (client.removeProducerById(producerId)) {
                socket.to(currentRoom.id).emit("producerClosed", {
                  producerId,
                  producerUserId: client.id,
                });
                cb({ success: true });
                return;
              }
            }
            cb({ error: "Producer not found" });
          });

          // Bulk Actions
          socket.on("muteAll", (cb) => {
            if (!currentRoom) return;
            let count = 0;

            for (const client of currentRoom.clients.values()) {
              // Skip admins (including self)
              if (client instanceof Admin) continue;

              const audioProducer = client.getProducer("audio");
              if (audioProducer) {
                if (client.removeProducerById(audioProducer.id)) {
                  socket.to(currentRoom.id).emit("producerClosed", {
                    producerId: audioProducer.id,
                    producerUserId: client.id,
                  });
                  count++;
                }
              }
            }
            cb({ success: true, count });
          });

          socket.on("closeAllVideo", (cb) => {
            if (!currentRoom) return;
            let count = 0;

            for (const client of currentRoom.clients.values()) {
              // Skip admins (including self)
              if (client instanceof Admin) continue;

              const videoProducer = client.getProducer("video");
              if (videoProducer) {
                if (client.removeProducerById(videoProducer.id)) {
                  socket.to(currentRoom.id).emit("producerClosed", {
                    producerId: videoProducer.id,
                    producerUserId: client.id,
                  });
                  count++;
                }
              }
            }
            cb({ success: true, count });
          });
        }

        callback({
          rtpCapabilities: currentRoom.rtpCapabilities,
          existingProducers,
        });
      } catch (error) {
        console.error("[SFU] Error joining room:", error);
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Get Router RTP Capabilities
  // ----------------------------------------
  socket.on(
    "getRouterRtpCapabilities",
    (
      callback: (response: { rtpCapabilities: any } | { error: string }) => void
    ) => {
      try {
        if (!currentRoom) {
          callback({ error: "Not in a room" });
          return;
        }
        callback({ rtpCapabilities: currentRoom.rtpCapabilities });
      } catch (error) {
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Create Producer Transport
  // ----------------------------------------
  socket.on(
    "createProducerTransport",
    async (
      callback: (response: CreateTransportResponse | { error: string }) => void
    ) => {
      try {
        if (!currentRoom || !currentClient) {
          callback({ error: "Not in a room" });
          return;
        }

        const transport = await currentRoom.createWebRtcTransport();
        currentClient.producerTransport = transport;

        callback({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates as any,
          dtlsParameters: transport.dtlsParameters,
        });
      } catch (error) {
        console.error("[SFU] Error creating producer transport:", error);
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Create Consumer Transport
  // ----------------------------------------
  socket.on(
    "createConsumerTransport",
    async (
      callback: (response: CreateTransportResponse | { error: string }) => void
    ) => {
      try {
        if (!currentRoom || !currentClient) {
          callback({ error: "Not in a room" });
          return;
        }

        const transport = await currentRoom.createWebRtcTransport();
        currentClient.consumerTransport = transport;

        callback({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates as any,
          dtlsParameters: transport.dtlsParameters,
        });
      } catch (error) {
        console.error("[SFU] Error creating consumer transport:", error);
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Connect Transport
  // ----------------------------------------
  socket.on(
    "connectProducerTransport",
    async (
      data: ConnectTransportData,
      callback: (response: { success: boolean } | { error: string }) => void
    ) => {
      try {
        if (!currentClient?.producerTransport) {
          callback({ error: "Producer transport not found" });
          return;
        }

        await currentClient.producerTransport.connect({
          dtlsParameters: data.dtlsParameters,
        });

        callback({ success: true });
      } catch (error) {
        console.error("[SFU] Error connecting producer transport:", error);
        callback({ error: (error as Error).message });
      }
    }
  );

  socket.on(
    "connectConsumerTransport",
    async (
      data: ConnectTransportData,
      callback: (response: { success: boolean } | { error: string }) => void
    ) => {
      try {
        if (!currentClient?.consumerTransport) {
          callback({ error: "Consumer transport not found" });
          return;
        }

        await currentClient.consumerTransport.connect({
          dtlsParameters: data.dtlsParameters,
        });

        callback({ success: true });
      } catch (error) {
        console.error("[SFU] Error connecting consumer transport:", error);
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Produce (Start sending audio/video)
  // ----------------------------------------
  socket.on(
    "produce",
    async (
      data: ProduceData,
      callback: (response: ProduceResponse | { error: string }) => void
    ) => {
      try {
        if (!currentRoom || !currentClient?.producerTransport) {
          callback({ error: "Not ready to produce" });
          return;
        }

        const { kind, rtpParameters, appData } = data;
        const type = (appData.type as "webcam" | "screen") || "webcam";
        const paused = !!appData.paused;

        // Check if screen sharing is allowed
        if (type === "screen") {
          const existingScreenShare = currentRoom.screenShareProducerId;
          if (existingScreenShare) {
            callback({ error: "Screen is already being shared" });
            return;
          }
        }

        const producer = await currentClient.producerTransport.produce({
          kind,
          rtpParameters,
          appData: { type },
          paused,
        });

        if (type === "screen") {
          currentRoom.setScreenShareProducer(producer.id);
        }

        currentClient.addProducer(producer);

        // Notify all other clients about the new producer
        socket.to(currentRoom.id).emit("newProducer", {
          producerId: producer.id,
          producerUserId: currentClient.id,
          kind,
          type,
          paused: producer.paused,
        });

        producer.on("transportclose", () => {
          console.log(`[SFU] Producer transport closed: ${producer.id}`);
          if (type === "screen" && currentRoom) {
            currentRoom.clearScreenShareProducer(producer.id);
          }
          // Notify others
          if (currentRoom && currentClient) {
            socket.to(currentRoom.id).emit("producerClosed", {
              producerId: producer.id,
              producerUserId: currentClient.id,
            });
          }
        });

        producer.on("@close", () => {
          console.log(`[SFU] Producer closed: ${producer.id}`);
          if (type === "screen" && currentRoom) {
            currentRoom.clearScreenShareProducer(producer.id);
          }
          // Notify others
          if (currentRoom && currentClient) {
            socket.to(currentRoom.id).emit("producerClosed", {
              producerId: producer.id,
              producerUserId: currentClient.id,
            });
          }
        });

        console.log(
          `[SFU] User ${currentClient.id} started producing ${kind} (${type}): ${producer.id}`
        );

        callback({ producerId: producer.id });
      } catch (error) {
        console.error("[SFU] Error producing:", error);
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Consume (Start receiving audio/video)
  // ----------------------------------------
  socket.on(
    "consume",
    async (
      data: ConsumeData,
      callback: (response: ConsumeResponse | { error: string }) => void
    ) => {
      try {
        if (!currentRoom || !currentClient?.consumerTransport) {
          callback({ error: "Not ready to consume" });
          return;
        }

        const { producerId, rtpCapabilities } = data;

        // Check if the router can consume this producer
        if (!currentRoom.canConsume(producerId, rtpCapabilities)) {
          callback({ error: "Cannot consume this producer" });
          return;
        }

        const consumer = await currentClient.consumerTransport.consume({
          producerId,
          rtpCapabilities,
          paused: false, // Start consuming immediately
        });

        currentClient.addConsumer(consumer);

        consumer.on("transportclose", () => {
          console.log(`[SFU] Consumer transport closed: ${consumer.id}`);
        });

        consumer.on("producerclose", () => {
          console.log(`[SFU] Producer closed for consumer: ${consumer.id}`);
          socket.emit("producerClosed", { producerId });
        });

        callback({
          id: consumer.id,
          producerId: consumer.producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      } catch (error) {
        console.error("[SFU] Error consuming:", error);
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Get Producers (List all producers in room)
  // ----------------------------------------
  socket.on(
    "getProducers",
    (
      callback: (
        response: { producers: ProducerInfo[] } | { error: string }
      ) => void
    ) => {
      try {
        if (!currentRoom || !currentClient) {
          callback({ error: "Not in a room" });
          return;
        }

        const producers = currentRoom.getAllProducers(currentClient.id);
        callback({ producers });
      } catch (error) {
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Resume Consumer
  // ----------------------------------------
  socket.on(
    "resumeConsumer",
    async (
      data: { consumerId: string },
      callback: (response: { success: boolean } | { error: string }) => void
    ) => {
      try {
        if (!currentClient) {
          callback({ error: "Not in a room" });
          return;
        }

        // Find the consumer
        for (const consumer of currentClient.consumers.values()) {
          if (consumer.id === data.consumerId) {
            await consumer.resume();
            callback({ success: true });
            return;
          }
        }

        callback({ error: "Consumer not found" });
      } catch (error) {
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Toggle Mute
  // ----------------------------------------
  socket.on(
    "toggleMute",
    async (
      data: ToggleMediaData,
      callback: (response: { success: boolean } | { error: string }) => void
    ) => {
      try {
        if (!currentClient || !currentRoom) {
          callback({ error: "Not in a room" });
          return;
        }

        await currentClient.toggleMute(data.paused);

        // Notify others
        socket.to(currentRoom.id).emit("participantMuted", {
          oderId: currentClient.id,
          muted: data.paused,
        });

        callback({ success: true });
      } catch (error) {
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Toggle Camera
  // ----------------------------------------
  socket.on(
    "toggleCamera",
    async (
      data: ToggleMediaData,
      callback: (response: { success: boolean } | { error: string }) => void
    ) => {
      try {
        if (!currentClient || !currentRoom) {
          callback({ error: "Not in a room" });
          return;
        }

        await currentClient.toggleCamera(data.paused);

        // Notify others
        socket.to(currentRoom.id).emit("participantCameraOff", {
          userId: currentClient.id,
          cameraOff: data.paused,
        });

        callback({ success: true });
      } catch (error) {
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Close Producer
  // ----------------------------------------
  socket.on(
    "closeProducer",
    async (
      data: { producerId: string },
      callback: (response: { success: boolean } | { error: string }) => void
    ) => {
      try {
        if (!currentClient || !currentRoom) {
          callback({ error: "Not in a room" });
          return;
        }

        // Find and close the producer using the new method
        const removed = currentClient.removeProducerById(data.producerId);
        if (removed) {
          // Clear screen share if it was a screen producer
          if (removed.type === "screen") {
            currentRoom.clearScreenShareProducer(data.producerId);
          }

          // Notify others
          socket.to(currentRoom.id).emit("producerClosed", {
            producerId: data.producerId,
            producerUserId: currentClient.id,
          });

          callback({ success: true });
          return;
        }

        callback({ error: "Producer not found" });
      } catch (error) {
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Send Chat Message
  // ----------------------------------------
  socket.on(
    "sendChat",
    (
      data: SendChatData,
      callback: (
        response:
          | { success: boolean; message?: ChatMessage }
          | { error: string }
      ) => void
    ) => {
      try {
        if (!currentClient || !currentRoom) {
          callback({ error: "Not in a room" });
          return;
        }

        // Validate message content
        const content = data.content?.trim();
        if (!content || content.length === 0) {
          callback({ error: "Message cannot be empty" });
          return;
        }

        if (content.length > 1000) {
          callback({ error: "Message too long (max 1000 characters)" });
          return;
        }

        // Rate limiting check
        const now = Date.now();
        if (now - lastChatTime < CHAT_RATE_LIMIT_MS) {
          callback({ error: "You are sending messages too fast" });
          return;
        }
        lastChatTime = now;

        // Extract display name from userId (format: email#sessionId)
        const displayName =
          currentClient.id.split("#")[0]?.split("@")[0] || "Anonymous";

        // Create chat message
        const message: ChatMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          userId: currentClient.id,
          displayName,
          content,
          timestamp: Date.now(),
        };

        // Broadcast to all users in the room (including sender for confirmation)
        socket.to(currentRoom.id).emit("chatMessage", message);

        console.log(
          `[SFU] Chat in room ${
            currentRoom.id
          }: ${displayName}: ${content.substring(0, 50)}`
        );

        callback({ success: true, message });
      } catch (error) {
        callback({ error: (error as Error).message });
      }
    }
  );

  // ----------------------------------------
  // Disconnect
  // ----------------------------------------
  socket.on("disconnect", () => {
    console.log(`[SFU] Client disconnected: ${socket.id}`);

    if (currentRoom && currentClient) {
      const userId = currentClient.id;
      const roomId = currentRoom.id;
      const wasAdmin = currentClient instanceof Admin;

      // Remove client from room
      currentRoom.removeClient(userId);
      socket.to(roomId).emit("userLeft", { userId });

      // If Admin left, check if any other admins remain
      if (wasAdmin) {
        if (!currentRoom.hasActiveAdmin()) {
          console.log(
            `[SFU] Last admin left room ${roomId}. Scheduling cleanup...`
          );
          currentRoom.startCleanupTimer(() => {
            if (rooms.has(roomId)) {
              const r = rooms.get(roomId);
              if (r) {
                console.log(
                  `[SFU] Cleanup executed for room ${roomId}. Dissolving...`
                );
                for (const client of r.clients.values()) {
                  client.socket.emit("roomClosed", {
                    reason: "Admin did not return. Room closed.",
                  });
                  client.socket.disconnect(true);
                }
                cleanupRoom(roomId);
              }
            }
          });
        } else {
          // Admin left but others remain
          console.log(
            `[SFU] Admin left room ${roomId}, but other admins remain.`
          );
        }
      }

      // Always cleanup if empty (handled by cleanupRoom check internally if we didn't already)
      if (rooms.has(roomId)) {
        cleanupRoom(roomId);
      }

      console.log(`[SFU] User ${userId} left room ${roomId}`);

      // Check for video quality update (e.g. dropped below threshold)
      if (rooms.has(roomId)) {
        // Room might have been cleaned up if empty, check presence
        const room = rooms.get(roomId);
        if (room) {
          const newQuality = room.updateVideoQuality();
          if (newQuality) {
            socket.to(roomId).emit("setVideoQuality", { quality: newQuality });
          }
        }
      }
    }

    currentRoom = null;
    currentClient = null;
  });
});

// ============================================
// Start Server
// ============================================

const startServer = async (): Promise<void> => {
  await initMediaSoup();

  httpsServer.listen(config.port, () => {
    console.log(`[SFU] HTTPS Server running on port ${config.port}`);
  });
};

startServer();
