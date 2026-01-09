import type {
  MediaKind,
  Router,
  RtpCapabilities,
  WebRtcTransport,
} from "mediasoup/types";
import type { VideoQuality } from "../../types.js";
import { Logger } from "../../utilities/Logger.js";
import { config } from "../config.js";
import { Admin } from "./Admin.js";
import type { Client } from "./Client.js"; // Needed for types/Client class

export interface RoomOptions {
  id: string;
  router: Router;
}

export class Room {
  public readonly id: string;
  public readonly router: Router;
  public clients: Map<string, Client> = new Map();
  public pendingClients: Map<
    string,
    { userKey: string; userId: string; socket: any; displayName?: string }
  > = new Map();
  public allowedUsers: Set<string> = new Set();
  public currentScreenShareProducerId: string | null = null;
  public currentQuality: VideoQuality = "standard";
  public userKeysById: Map<string, string> = new Map();
  public displayNamesByKey: Map<string, string> = new Map();
  public handRaisedByUserId: Set<string> = new Set();

  constructor(options: RoomOptions) {
    this.id = options.id;
    this.router = options.router;
  }

  /**
   * Get the router's RTP capabilities
   */
  get rtpCapabilities(): RtpCapabilities {
    return this.router.rtpCapabilities;
  }

  /**
   * Add a client to the room
   */
  addClient(client: Client): void {
    this.clients.set(client.id, client);
  }

  /**
   * Register or update identity mapping for a connected user.
   */
  setUserIdentity(
    userId: string,
    userKey: string,
    displayName: string,
    options?: { forceDisplayName?: boolean }
  ): void {
    this.userKeysById.set(userId, userKey);
    if (options?.forceDisplayName || !this.displayNamesByKey.has(userKey)) {
      this.displayNamesByKey.set(userKey, displayName);
    }
  }

  /**
   * Get the display name for a given user id.
   */
  getDisplayNameForUser(userId: string): string | undefined {
    const userKey = this.userKeysById.get(userId);
    if (!userKey) return undefined;
    return this.displayNamesByKey.get(userKey);
  }

  /**
   * Snapshot display names for all connected clients.
   */
  getDisplayNameSnapshot(): { userId: string; displayName: string }[] {
    const snapshot: { userId: string; displayName: string }[] = [];
    for (const [userId, client] of this.clients.entries()) {
      if (client.isGhost) continue;
      const displayName = this.getDisplayNameForUser(userId) || userId;
      snapshot.push({ userId, displayName });
    }
    return snapshot;
  }

  /**
   * Update display name for a user key and return affected user ids.
   */
  updateDisplayName(userKey: string, displayName: string): string[] {
    this.displayNamesByKey.set(userKey, displayName);
    const userIds: string[] = [];
    for (const [userId, key] of this.userKeysById.entries()) {
      if (key === userKey) {
        userIds.push(userId);
      }
    }
    return userIds;
  }

  /**
   * Remove a client from the room and clean up
   */
  removeClient(clientId: string): Client | undefined {
    const client = this.clients.get(clientId);
    if (client) {
      client.close();
      this.clients.delete(clientId);
    }
    this.userKeysById.delete(clientId);
    this.handRaisedByUserId.delete(clientId);
    return client;
  }

  /**
   * Update raise-hand status for a user.
   */
  setHandRaised(userId: string, raised: boolean): void {
    if (raised) {
      this.handRaisedByUserId.add(userId);
    } else {
      this.handRaisedByUserId.delete(userId);
    }
  }

  /**
   * Snapshot raised hands for connected users.
   */
  getHandRaisedSnapshot(): { userId: string; raised: boolean }[] {
    const snapshot: { userId: string; raised: boolean }[] = [];
    for (const userId of this.handRaisedByUserId) {
      snapshot.push({ userId, raised: true });
    }
    return snapshot;
  }

  /**
   * Get a client by ID
   */
  getClient(clientId: string): Client | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get all clients except the specified one
   */
  getOtherClients(excludeClientId: string): Client[] {
    const others: Client[] = [];
    for (const [id, client] of this.clients) {
      if (id !== excludeClientId) {
        others.push(client);
      }
    }
    return others;
  }

  /**
   * Get total number of clients
   */
  get clientCount(): number {
    return this.clients.size;
  }

  /**
   * Create a WebRTC transport for a client
   */
  async createWebRtcTransport(): Promise<WebRtcTransport> {
    const transport = await this.router.createWebRtcTransport({
      listenIps: config.webRtcTransport.listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate:
        config.webRtcTransport.initialAvailableOutgoingBitrate,
    });

    // Set max incoming bitrate for 360p
    if (config.webRtcTransport.maxIncomingBitrate) {
      await transport.setMaxIncomingBitrate(
        config.webRtcTransport.maxIncomingBitrate,
      );
    }

    return transport;
  }

  /**
   * Check if screen is currently being shared
   */
  get screenShareProducerId(): string | null {
    return this.currentScreenShareProducerId;
  }

  setScreenShareProducer(producerId: string) {
    this.currentScreenShareProducerId = producerId;
  }

  clearScreenShareProducer(producerId: string) {
    if (this.currentScreenShareProducerId === producerId) {
      this.currentScreenShareProducerId = null;
    }
  }

  /**
   * Get all existing producers in the room (for new clients to consume)
   */
  getAllProducers(excludeClientId?: string): {
    producerId: string;
    producerUserId: string;
    kind: MediaKind;
    type: "webcam" | "screen";
    paused: boolean;
  }[] {
    const producers: {
      producerId: string;
      producerUserId: string;
      kind: MediaKind;
      type: "webcam" | "screen";
      paused: boolean;
    }[] = [];

    for (const [clientId, client] of this.clients) {
      if (excludeClientId && clientId === excludeClientId) {
        continue;
      }
      if (client.isGhost) {
        continue;
      }
      // Use the client's getProducerInfos which properly parses the new key format
      for (const info of client.getProducerInfos()) {
        producers.push({
          producerId: info.producerId,
          producerUserId: clientId,
          kind: info.kind,
          type: info.type,
          paused: info.paused,
        });
      }
    }

    return producers;
  }

  /**
   * Check if the router can consume from a producer
   */
  canConsume(producerId: string, rtpCapabilities: RtpCapabilities): boolean {
    return this.router.canConsume({ producerId, rtpCapabilities });
  }

  /**
   * Check if room has no active or pending clients
   */
  isEmpty(): boolean {
    return this.clients.size === 0 && this.pendingClients.size === 0;
  }

  /**
   * Get all Admin clients in the room
   */
  getAdmins(): Admin[] {
    const admins: Admin[] = [];
    for (const client of this.clients.values()) {
      if (client instanceof Admin) {
        admins.push(client);
      }
    }
    return admins;
  }

  /**
   * Check if there is at least one admin in the room
   */
  hasActiveAdmin(): boolean {
    for (const client of this.clients.values()) {
      if (client instanceof Admin) {
        return true;
      }
    }
    return false;
  }

  /**
   * Close the room and all clients
   */
  /**
   * Determine the target video quality based on participant count
   */
  getTargetVideoQuality(): VideoQuality {
    // Thresholds from config
    const { lowThreshold, standardThreshold } = config.videoQuality;

    if (this.currentQuality === "standard") {
      if (this.clients.size >= lowThreshold) {
        return "low";
      }
    } else {
      // current is 'low'
      if (this.clients.size <= standardThreshold) {
        return "standard";
      }
    }
    return this.currentQuality;
  }

  /**
   * Update and return the new quality if it has changed
   */
  updateVideoQuality(): VideoQuality | null {
    const target = this.getTargetVideoQuality();
    if (target !== this.currentQuality) {
      this.currentQuality = target;
      return target;
    }
    return null;
  }

  close(): void {
    this.stopCleanupTimer();
    // Close all clients
    for (const client of this.clients.values()) {
      client.close();
    }
    this.clients.clear();

    // Close the router
    this.router.close();
    this.userKeysById.clear();
    this.displayNamesByKey.clear();
  }

  // ============================================
  // Cleanup Timer (Admin Timeout)
  // ============================================
  public cleanupTimer: NodeJS.Timeout | null = null;

  startCleanupTimer(callback: () => void) {
    if (this.cleanupTimer) return;

    Logger.debug(
      `Room ${this.id}: Cleanup timer started (${config.adminCleanupTimeout}ms)`,
    );
    this.cleanupTimer = setTimeout(() => {
      Logger.debug(`Room ${this.id}: Cleanup timer expired. Dissolving room.`);
      this.cleanupTimer = null;
      callback();
    }, config.adminCleanupTimeout);
  }

  stopCleanupTimer() {
    if (this.cleanupTimer) {
      Logger.debug(`Room ${this.id}: Cleanup timer stopped.`);
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // ============================================
  // Waiting Room Methods
  // ============================================

  addPendingClient(
    userKey: string,
    userId: string,
    socket: any,
    displayName?: string
  ) {
    this.pendingClients.set(userKey, { userKey, userId, socket, displayName });
  }

  removePendingClient(userKey: string) {
    this.pendingClients.delete(userKey);
  }

  allowUser(userKey: string) {
    this.allowedUsers.add(userKey);
    this.pendingClients.delete(userKey);
  }

  isAllowed(userKey: string): boolean {
    return this.allowedUsers.has(userKey);
  }
}

export default Room;
