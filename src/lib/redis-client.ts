import { createClient, type RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType> | null = null;

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

export const getRedisClient = async (): Promise<RedisClientType> => {
  if (redisClient?.isOpen) return redisClient;

  if (!connectPromise) {
    redisClient = createClient({ url: getRedisUrl() });
    redisClient.on("error", (error) => {
      console.error("[Redis] Connection error:", error);
    });
    connectPromise = redisClient.connect().then(() => redisClient as RedisClientType);
  }

  return connectPromise;
};
