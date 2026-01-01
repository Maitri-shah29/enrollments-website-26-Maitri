import type {
  Router,
  WebRtcTransport,
  RtpCapabilities,
  MediaKind,
} from "mediasoup/types";
import { Client } from "./Client.js"; // Needed for types/Client class
import { Admin } from "./Admin.js";
import { config } from "../config.js";
import { VideoQuality, WaitingClient } from "../../types.js";

export interface RoomOptions {
  id: string;
  router: Router;
}

export class Room {
  public readonly id: string;
  public readonly router: Router;
  public clients: Map<string, Client> = new Map();
  public pendingClients: Map<string, WaitingClient> = new Map();
  public currentScreenShareProducerId: string | null = null;
  public currentQuality: VideoQuality = "standard";

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
   * Add a client to the pending list (Waiting Room)
   */
  addPendingClient(client: WaitingClient): void {
    this.pendingClients.set(client.userId, client);
  }

  /**
   * Remove a client from the pending list
   */
  removePendingClient(clientId: string): boolean {
    return this.pendingClients.delete(clientId);
  }

  /**
   * Get all pending clients
   */
  getPendingClients(): WaitingClient[] {
    return Array.from(this.pendingClients.values());
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
    return client;
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
        config.webRtcTransport.maxIncomingBitrate
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
   * Check if room is empty
   */
  isEmpty(): boolean {
    return this.clients.size === 0;
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
  }

  // ============================================
  // Cleanup Timer (Admin Timeout)
  // ============================================
  public cleanupTimer: NodeJS.Timeout | null = null;

  startCleanupTimer(callback: () => void) {
    if (this.cleanupTimer) return;

    console.log(
      `[SFU] Room ${this.id}: Cleanup timer started (${config.adminCleanupTimeout}ms)`
    );
    this.cleanupTimer = setTimeout(() => {
      console.log(
        `[SFU] Room ${this.id}: Cleanup timer expired. Dissolving room.`
      );
      callback();
    }, config.adminCleanupTimeout);
  }

  stopCleanupTimer() {
    if (this.cleanupTimer) {
      console.log(`[SFU] Room ${this.id}: Cleanup timer stopped.`);
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

export default Room;
