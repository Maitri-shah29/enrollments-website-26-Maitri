import type { Socket } from "socket.io";
import type {
  WebRtcTransport,
  Producer,
  Consumer,
  MediaKind,
} from "mediasoup/types";

export interface ClientOptions {
  id: string;
  socket: Socket;
}

/** Type of producer: webcam or screen share */
export type ProducerType = "webcam" | "screen";

/** Composite key for producer storage: "audio-webcam", "video-webcam", "video-screen" */
export type ProducerKey = `${MediaKind}-${ProducerType}`;

/** Helper to create a producer key */
export function createProducerKey(
  kind: MediaKind,
  type: ProducerType
): ProducerKey {
  return `${kind}-${type}`;
}

export class Client {
  public readonly id: string;
  public readonly socket: Socket;

  // Transports
  public producerTransport: WebRtcTransport | null = null;
  public consumerTransport: WebRtcTransport | null = null;

  // Producers keyed by "kind-type" (e.g., "video-webcam", "video-screen")
  public producers: Map<ProducerKey, Producer> = new Map();

  // Consumers keyed by producer id
  public consumers: Map<string, Consumer> = new Map();

  // Media state
  public isMuted: boolean = false;
  public isCameraOff: boolean = false;

  constructor(options: ClientOptions) {
    this.id = options.id;
    this.socket = options.socket;
  }

  /**
   * Add a producer (audio or video, webcam or screen)
   */
  addProducer(producer: Producer): void {
    const type = (producer.appData.type as ProducerType) || "webcam";
    const key = createProducerKey(producer.kind, type);

    this.producers.set(key, producer);

    producer.on("transportclose", () => {
      this.producers.delete(key);
    });
  }

  /**
   * Add a consumer for a remote producer
   */
  addConsumer(consumer: Consumer): void {
    this.consumers.set(consumer.producerId, consumer);

    consumer.on("transportclose", () => {
      this.consumers.delete(consumer.producerId);
    });

    consumer.on("producerclose", () => {
      this.consumers.delete(consumer.producerId);
    });
  }

  /**
   * Get producer by kind and type
   */
  getProducer(
    kind: MediaKind,
    type: ProducerType = "webcam"
  ): Producer | undefined {
    return this.producers.get(createProducerKey(kind, type));
  }

  /**
   * Get consumer by producer id
   */
  getConsumer(producerId: string): Consumer | undefined {
    return this.consumers.get(producerId);
  }

  /**
   * Toggle audio mute state
   */
  async toggleMute(paused: boolean): Promise<void> {
    const audioProducer = this.getProducer("audio", "webcam");
    if (audioProducer) {
      if (paused) {
        await audioProducer.pause();
      } else {
        await audioProducer.resume();
      }
      this.isMuted = paused;
    }
  }

  /**
   * Toggle camera state
   */
  async toggleCamera(paused: boolean): Promise<void> {
    const videoProducer = this.getProducer("video", "webcam");
    if (videoProducer) {
      if (paused) {
        await videoProducer.pause();
      } else {
        await videoProducer.resume();
      }
      this.isCameraOff = paused;
    }
  }

  /**
   * Close all transports, producers, and consumers
   */
  close(): void {
    // Close all consumers
    for (const consumer of this.consumers.values()) {
      consumer.close();
    }
    this.consumers.clear();

    // Close all producers
    for (const producer of this.producers.values()) {
      producer.close();
    }
    this.producers.clear();

    // Close transports
    if (this.producerTransport) {
      this.producerTransport.close();
      this.producerTransport = null;
    }

    if (this.consumerTransport) {
      this.consumerTransport.close();
      this.consumerTransport = null;
    }
  }

  /**
   * Get all producer info for this client
   */
  getProducerInfos(): {
    producerId: string;
    kind: MediaKind;
    type: ProducerType;
  }[] {
    const infos: { producerId: string; kind: MediaKind; type: ProducerType }[] =
      [];
    for (const [key, producer] of this.producers) {
      const [kind, type] = key.split("-") as [MediaKind, ProducerType];
      infos.push({ producerId: producer.id, kind, type });
    }
    return infos;
  }

  /**
   * Find and remove a producer by its ID
   */
  removeProducerById(
    producerId: string
  ): { kind: MediaKind; type: ProducerType } | null {
    for (const [key, producer] of this.producers) {
      if (producer.id === producerId) {
        producer.close();
        this.producers.delete(key);
        const [kind, type] = key.split("-") as [MediaKind, ProducerType];
        return { kind, type };
      }
    }
    return null;
  }
}

export default Client;
