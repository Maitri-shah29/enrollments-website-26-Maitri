import { Redis as UpstashRedis } from "@upstash/redis";
import { createClient, type RedisClientType } from "redis";

export type RedisLike = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<unknown>;
  del: (key: string) => Promise<number>;
};

let redisClient: RedisClientType | null = null;
let connectPromise: Promise<RedisLike> | null = null;

const getRedisUrl = (): string => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const password = process.env.REDIS_PASSWORD;
  if (password) {
    return `redis://:${password}@127.0.0.1:6379`;
  }

  return "redis://127.0.0.1:6379";
};

const getUpstashClient = (): RedisLike | null => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const client = new UpstashRedis({ url, token });
  return {
    get: (key: string) => client.get<string>(key),
    set: (key: string, value: string) => client.set(key, value),
    del: (key: string) => client.del(key),
  };
};

export const getRedisClient = async (): Promise<RedisLike> => {
  const upstash = getUpstashClient();
  if (upstash) return upstash;

  const existingClient = redisClient;
  if (existingClient?.isOpen) {
    return {
      get: (key: string) => existingClient.get(key),
      set: (key: string, value: string) => existingClient.set(key, value),
      del: (key: string) => existingClient.del(key),
    };
  }

  if (!connectPromise) {
    redisClient = createClient({ url: getRedisUrl() });
    redisClient.on("error", (error) => {
      console.error("[Redis] Connection error:", error);
    });
    connectPromise = redisClient.connect().then(() => {
      const connectedClient = redisClient as RedisClientType;
      return {
        get: (key: string) => connectedClient.get(key),
        set: (key: string, value: string) => connectedClient.set(key, value),
        del: (key: string) => connectedClient.del(key),
      };
    });
  }

  return connectPromise;
};
