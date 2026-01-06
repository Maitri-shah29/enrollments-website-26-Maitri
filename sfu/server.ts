import cors from "cors";
import express from "express";
import { readFileSync } from "fs";

import { createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import jwt from "jsonwebtoken";
import type { Worker } from "mediasoup/types";
import { dirname, join } from "path";
import { type Socket, Server as SocketIOServer } from "socket.io";
import { fileURLToPath } from "url";
import { Admin } from "./config/classes/Admin.js";
import { Client } from "./config/classes/Client.js";
import { Room } from "./config/classes/Room.js";
import { config } from "./config/config.js";
import type {
  ChatMessage,
  ConnectTransportData,
  ConsumeData,
  ConsumeResponse,
  CreateTransportResponse,
  GetRoomsResponse,
  JoinRoomData,
  JoinRoomResponse,
  ProduceData,
  ProduceResponse,
  ProducerInfo,
  RedirectData,
  SendChatData,
  ToggleMediaData,
} from "./types.js";
import createWorkers from "./utilities/createWorkers.js";
import getWorker from "./utilities/getWorker.js";
import { Logger } from "./utilities/Logger.js";

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
app.use(cors());

// ============================================
// Health Check Endpoint
// ============================================
app.get("/health", (req, res) => {
  const healthyWorkers = workers.filter((worker) => !worker.closed);
  const isHealthy = healthyWorkers.length > 0;

  const healthData = {
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    workers: {
      total: workers.length,
      healthy: healthyWorkers.length,
      closed: workers.length - healthyWorkers.length,
    },
  };

  if (!isHealthy) {
    Logger.error("Health check failed: No healthy workers available");
    return res.status(503).json(healthData);
  }

  res.json(healthData);
});

// Load SSL certificates
// const httpsOptions = {
//   key: readFileSync(join(__dirname, "certs", "cert.key")),
//   cert: readFileSync(join(__dirname, "certs", "cert.crt")),
// };

// const httpsServer = createHttpsServer(httpsOptions, app);

const httpServer = createHttpServer(app);

const io = new SocketIOServer(httpServer, {
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
  Logger.info(`Created ${workers.length} mediasoup workers`);
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
  Logger.success(`Created room: ${roomId}`);

  return room;
};

const cleanupRoom = (roomId: string): void => {
  const room = rooms.get(roomId);
  if (room && room.isEmpty()) {
    room.close();
    rooms.delete(roomId);
    Logger.info(`Closed empty room: ${roomId}`);
  }
};

const buildUserIdentity = (
  user: { email?: string; userId?: string; name?: string; sessionId?: string },
  sessionId: string | undefined,
  socketId: string,
): { userKey: string; userId: string; displayName: string } | null => {
  const baseId = user?.email || user?.userId;
  if (!baseId) {
    return null;
  }

  const effectiveSessionId = user?.sessionId || sessionId || socketId;
  return {
    userKey: baseId,
    userId: `${baseId}#${effectiveSessionId}`,
    displayName: user?.name || baseId,
  };
};

// ============================================
// Socket.io Connection Handler
// ============================================

io.on("connection", (socket: Socket) => {
  Logger.info(`Client connected: ${socket.id}`);

  let currentRoom: Room | null = null;
  let currentClient: Client | null = null;
  let pendingRoomId: string | null = null;
  let pendingUserKey: string | null = null;

  // ----------------------------------------
  // Join Room
  // ----------------------------------------
  socket.on(
    "joinRoom",
    async (
      data: JoinRoomData,
      callback: (response: JoinRoomResponse | { error: string }) => void,
    ) => {
      try {
        const { roomId, sessionId } = data;
        const user = (socket as any).user;
        const isAdmin = user?.isAdmin;
        const identity = buildUserIdentity(user, sessionId, socket.id);
        if (!identity) {
          callback({ error: "Authentication error: Invalid token payload" });
          return;
        }
        if (user?.sessionId && sessionId && user.sessionId !== sessionId) {
          callback({ error: "Session mismatch" });
          return;
        }
        const { userKey, userId, displayName } = identity;

        // Get or create room
        let room = rooms.get(roomId);

        if (!room) {
          if (!isAdmin && !config.allowNonAdminRoomCreation) {
            callback({ error: "This meeting hasn't started." });
            return;
          }
          // Create room if admin or if allowed by config
          room = await getOrCreateRoom(roomId);
        } else {
          // Room exists

          // Check if user is already in THIS room
          if (room.getClient(userId)) {
            // If already in this room, effectively a reconnect/refresh.
            // We technically don't need to do anything special here as the client object will be replaced.
            // But let's log it.
            Logger.warn(`User ${userId} re-joining room ${roomId}`);
            room.removeClient(userId);
          }

          // Check if cleanup timer is active
          if (isAdmin && room.cleanupTimer) {
            Logger.info(
              `Admin returning to room ${roomId}, cleanup cancelled.`,
            );
            room.stopCleanupTimer();
          }
        }

        // ============================================
        // WAITING ROOM LOGIC
        // ============================================
        if (!isAdmin && !room.isAllowed(userKey)) {
          Logger.info(`User ${userKey} added to waiting room ${roomId}`);
          room.addPendingClient(userKey, userId, socket, displayName);
          pendingRoomId = roomId;
          pendingUserKey = userKey;

          // Notify all admins in the room
          const admins = room.getAdmins();
          for (const admin of admins) {
            admin.socket.emit("userRequestedJoin", {
              userId: userKey,
              displayName,
            });
          }

          callback({
            rtpCapabilities: room.rtpCapabilities,
            existingProducers: [],
            status: "waiting",
          });
          return;
        }

        // Handle Room Switching:
        // If the socket was already in a room (different from the new one), allow them to leave cleanly
        // WITHOUT disconnecting the socket.
        if (currentRoom && currentRoom.id !== roomId && currentClient) {
          Logger.info(
            `User ${userId} switching from ${currentRoom.id} to ${roomId}`,
          );

          // Remove from old room
          currentRoom.removeClient(currentClient.id);

          // Notify old room
          socket
            .to(currentRoom.id)
            .emit("userLeft", { userId: currentClient.id });

          // Leave socket room
          socket.leave(currentRoom.id);

          // Check if old room is empty and needs cleanup
          cleanupRoom(currentRoom.id);

          // Reset references
          currentRoom = null;
          currentClient = null;
        }

        currentRoom = room;
        pendingRoomId = null;
        pendingUserKey = null;

        // Create client based on role
        if (isAdmin) {
          currentClient = new Admin({ id: userId, socket });
        } else {
          // Should not happen here if logic above is correct, but for typescript:
          currentClient = new Client({ id: userId, socket });
        }

        currentRoom.addClient(currentClient);

        // Join socket room for broadcasting
        socket.join(roomId);

        if (currentClient instanceof Admin) {
          for (const pending of currentRoom.pendingClients.values()) {
            socket.emit("userRequestedJoin", {
              userId: pending.userKey,
              displayName: pending.displayName || pending.userKey,
            });
          }
        }

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

        Logger.debug(
          `User ${userId} joined room ${roomId} as ${
            isAdmin ? "Admin" : "Client"
          }`,
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
            },
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

          socket.on("getRooms", (cb) => {
            const roomList = Array.from(rooms.values()).map((r) => ({
              id: r.id,
              userCount: r.clientCount,
            }));
            cb({ rooms: roomList });
          });

          socket.on(
            "redirectUser",
            ({ userId: targetId, newRoomId }: RedirectData, cb) => {
              if (!currentRoom) return;

              const targetClient = currentRoom.getClient(targetId);
              if (targetClient) {
                Logger.info(
                  `Admin redirecting user ${targetId} to ${newRoomId}`,
                );
                targetClient.socket.emit("redirect", { newRoomId });
                cb({ success: true });
              } else {
                cb({ error: "User not found" });
              }
            },
          );

          socket.on("admitUser", ({ userId: targetId }, cb) => {
            if (!currentRoom) return;

            const pending = currentRoom.pendingClients.get(targetId);
            if (pending) {
              Logger.info(
                `Admin admitted user ${pending.userKey} to room ${roomId}`,
              );
              currentRoom.allowUser(pending.userKey);
              pending.socket.emit("joinApproved");

              // Notify all admins so they can remove from list
              for (const admin of currentRoom.getAdmins()) {
                admin.socket.emit("userAdmitted", { userId: pending.userKey });
              }

              cb({ success: true });
            } else {
              cb({ error: "User not found in waiting room" });
            }
          });

          socket.on("rejectUser", ({ userId: targetId }, cb) => {
            if (!currentRoom) return;

            const pending = currentRoom.pendingClients.get(targetId);
            if (pending) {
              Logger.info(
                `Admin rejected user ${pending.userKey} from room ${roomId}`,
              );
              currentRoom.removePendingClient(pending.userKey);
              pending.socket.emit("joinRejected");

              // Notify all admins so they can remove from list
              for (const admin of currentRoom.getAdmins()) {
                admin.socket.emit("userRejected", { userId: pending.userKey });
              }

              cb({ success: true });
            } else {
              cb({ error: "User not found in waiting room" });
            }
          });
        }

        callback({
          rtpCapabilities: currentRoom!.rtpCapabilities,
          existingProducers,
          status: "joined",
        });
      } catch (error) {
        Logger.error("Error joining room:", error);
        callback({ error: (error as Error).message });
      }
    },
  );

  // ----------------------------------------
  // Get Router RTP Capabilities
  // ----------------------------------------
  socket.on(
    "getRouterRtpCapabilities",
    (
      callback: (
        response: { rtpCapabilities: any } | { error: string },
      ) => void,
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
    },
  );

  // ----------------------------------------
  // Create Producer Transport
  // ----------------------------------------
  socket.on(
    "createProducerTransport",
    async (
      callback: (response: CreateTransportResponse | { error: string }) => void,
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
        Logger.error("Error creating producer transport:", error);
        callback({ error: (error as Error).message });
      }
    },
  );

  // ----------------------------------------
  // Create Consumer Transport
  // ----------------------------------------
  socket.on(
    "createConsumerTransport",
    async (
      callback: (response: CreateTransportResponse | { error: string }) => void,
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
        Logger.error("Error creating consumer transport:", error);
        callback({ error: (error as Error).message });
      }
    },
  );

  // ----------------------------------------
  // Connect Transport
  // ----------------------------------------
  socket.on(
    "connectProducerTransport",
    async (
      data: ConnectTransportData,
      callback: (response: { success: boolean } | { error: string }) => void,
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
        Logger.error("Error connecting producer transport:", error);
        callback({ error: (error as Error).message });
      }
    },
  );

  socket.on(
    "connectConsumerTransport",
    async (
      data: ConnectTransportData,
      callback: (response: { success: boolean } | { error: string }) => void,
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
        Logger.error("Error connecting consumer transport:", error);
        callback({ error: (error as Error).message });
      }
    },
  );

  // ----------------------------------------
  // Produce (Start sending audio/video)
  // ----------------------------------------
  socket.on(
    "produce",
    async (
      data: ProduceData,
      callback: (response: ProduceResponse | { error: string }) => void,
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

        // Capture values for event listeners to avoid stale closure
        const roomId = currentRoom.id;
        const clientId = currentClient.id;

        let producerClosed = false;
        const notifyProducerClosed = () => {
          if (producerClosed) return;
          producerClosed = true;

          Logger.info(`Producer closed: ${producer.id}`);
          const room = rooms.get(roomId);
          if (!room) return;

          if (type === "screen") {
            room.clearScreenShareProducer(producer.id);
          }

          socket.to(roomId).emit("producerClosed", {
            producerId: producer.id,
            producerUserId: clientId,
          });
        };

        producer.on("transportclose", notifyProducerClosed);
        producer.observer.on("close", notifyProducerClosed);

        Logger.info(
          `User ${currentClient.id} started producing ${kind} (${type}): ${producer.id}`,
        );

        callback({ producerId: producer.id });
      } catch (error) {
        Logger.error("Error producing:", error);
        callback({ error: (error as Error).message });
      }
    },
  );

  // ----------------------------------------
  // Consume (Start receiving audio/video)
  // ----------------------------------------
  socket.on(
    "consume",
    async (
      data: ConsumeData,
      callback: (response: ConsumeResponse | { error: string }) => void,
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
          Logger.info(`Consumer transport closed: ${consumer.id}`);
        });

        consumer.on("producerclose", () => {
          Logger.info(`Producer closed for consumer: ${consumer.id}`);
          socket.emit("producerClosed", { producerId });
        });

        callback({
          id: consumer.id,
          producerId: consumer.producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      } catch (error) {
        Logger.error("Error consuming:", error);
        callback({ error: (error as Error).message });
      }
    },
  );

  // ----------------------------------------
  // Get Producers (List all producers in room)
  // ----------------------------------------
  socket.on(
    "getProducers",
    (
      callback: (
        response: { producers: ProducerInfo[] } | { error: string },
      ) => void,
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
    },
  );

  // ----------------------------------------
  // Resume Consumer
  // ----------------------------------------
  socket.on(
    "resumeConsumer",
    async (
      data: { consumerId: string },
      callback: (response: { success: boolean } | { error: string }) => void,
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
    },
  );

  // ----------------------------------------
  // Toggle Mute
  // ----------------------------------------
  socket.on(
    "toggleMute",
    async (
      data: ToggleMediaData,
      callback: (response: { success: boolean } | { error: string }) => void,
    ) => {
      try {
        if (!currentClient || !currentRoom) {
          callback({ error: "Not in a room" });
          return;
        }

        await currentClient.toggleMute(data.paused);

        // Notify others
        socket.to(currentRoom.id).emit("participantMuted", {
          userId: currentClient.id,
          muted: data.paused,
        });

        callback({ success: true });
      } catch (error) {
        callback({ error: (error as Error).message });
      }
    },
  );

  // ----------------------------------------
  // Toggle Camera
  // ----------------------------------------
  socket.on(
    "toggleCamera",
    async (
      data: ToggleMediaData,
      callback: (response: { success: boolean } | { error: string }) => void,
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
    },
  );

  // ----------------------------------------
  // Close Producer
  // ----------------------------------------
  socket.on(
    "closeProducer",
    async (
      data: { producerId: string },
      callback: (response: { success: boolean } | { error: string }) => void,
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
    },
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
          | { error: string },
      ) => void,
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
        Logger.info(
          `Chat in room ${currentRoom.id}: ${displayName}: ${content.substring(
            0,
            50,
          )}`,
        );

        callback({ success: true, message });
      } catch (error) {
        callback({ error: (error as Error).message });
      }
    },
  );

  // ----------------------------------------
  // Disconnect
  // ----------------------------------------
  socket.on("disconnect", () => {
    Logger.info(`Client disconnected: ${socket.id}`);

    if (currentRoom && currentClient) {
      const userId = currentClient.id;
      const roomId = currentRoom.id;
      const wasAdmin = currentClient instanceof Admin;
      const activeClient = currentRoom.getClient(userId);

      if (!activeClient) {
        Logger.info(
          `Stale disconnect for ${userId} in room ${roomId}; client already removed.`,
        );
      } else if (activeClient !== currentClient) {
        Logger.info(
          `Stale disconnect for ${userId} in room ${roomId}; active session exists.`,
        );
      } else {
        // Remove client from room
        currentRoom.removeClient(userId);
        socket.to(roomId).emit("userLeft", { userId });

        // If Admin left, check if any other admins remain
        if (wasAdmin) {
          if (!currentRoom.hasActiveAdmin()) {
            Logger.info(
              `Last admin left room ${roomId}. Scheduling cleanup...`,
            );
            currentRoom.startCleanupTimer(() => {
              if (rooms.has(roomId)) {
                const r = rooms.get(roomId);
                if (r) {
                  Logger.info(
                    `Cleanup executed for room ${roomId}. Dissolving...`,
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
            Logger.info(`Admin left room ${roomId}, but other admins remain.`);
          }
        }

        // Always cleanup if empty (handled by cleanupRoom check internally if we didn't already)
        if (rooms.has(roomId)) {
          cleanupRoom(roomId);
        }

        Logger.info(`User ${userId} left room ${roomId}`);

        // Check for video quality update (e.g. dropped below threshold)
        if (rooms.has(roomId)) {
          // Room might have been cleaned up if empty, check presence
          const room = rooms.get(roomId);
          if (room) {
            const newQuality = room.updateVideoQuality();
            if (newQuality) {
              socket
                .to(roomId)
                .emit("setVideoQuality", { quality: newQuality });
            }
          }
        }
      }
    }

    if (!currentClient && pendingRoomId && pendingUserKey) {
      const pendingRoom = rooms.get(pendingRoomId);
      if (pendingRoom) {
        const pending = pendingRoom.pendingClients.get(pendingUserKey);
        if (pending?.socket?.id === socket.id) {
          pendingRoom.removePendingClient(pendingUserKey);
          for (const admin of pendingRoom.getAdmins()) {
            admin.socket.emit("pendingUserLeft", { userId: pendingUserKey });
          }
        }
      }
    }

    currentRoom = null;
    currentClient = null;
    pendingRoomId = null;
    pendingUserKey = null;
  });
});

// ============================================
// Start Server
// ============================================

const startServer = async (): Promise<void> => {
  await initMediaSoup();

  httpServer.listen(config.port, () => {
    Logger.success(`HTTPS Server running on port ${config.port}`);
  });
};

startServer();
