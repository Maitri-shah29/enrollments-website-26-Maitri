import type { RoomInfo } from "./sfu-types";
import { getRedisClient } from "./redis-client";
import {
  fetchSfuRooms,
  fetchSfuStatus,
  getSfuPool,
  roomExistsOnSfu,
  type SfuInstance,
} from "./sfu-pool";

const ROOM_KEY_PREFIX = "sfu:room:";

const getRoomKey = (roomId: string): string => `${ROOM_KEY_PREFIX}${roomId}`;

const pickInstance = async (
  pool: SfuInstance[],
): Promise<SfuInstance | null> => {
  const statuses = await Promise.all(
    pool.map(async (instance) => ({
      instance,
      status: await fetchSfuStatus(instance),
    })),
  );

  const candidates = statuses.filter(
    (entry) => entry.status && !entry.status.draining,
  );

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const roomsA = a.status?.rooms ?? 0;
    const roomsB = b.status?.rooms ?? 0;
    return roomsA - roomsB;
  });

  return candidates[0]?.instance ?? null;
};

export const getSfuForRoom = async (roomId: string): Promise<SfuInstance> => {
  if (!roomId) {
    throw new Error("Missing room ID");
  }

  const pool = getSfuPool();
  if (!pool.length) {
    throw new Error("SFU pool is not configured");
  }

  const redis = await getRedisClient();
  const roomKey = getRoomKey(roomId);
  const assignedId = await redis.get(roomKey);

  if (assignedId) {
    const assigned =
      pool.find((entry) => entry.id === assignedId) ||
      pool.find((entry) => entry.url === assignedId);

    if (assigned) {
      const exists = await roomExistsOnSfu(assigned, roomId);
      if (exists) return assigned;
    }

    await redis.del(roomKey);
  }

  const selected = await pickInstance(pool);
  if (!selected) {
    throw new Error("No available SFU instances");
  }

  await redis.set(roomKey, selected.id);
  return selected;
};

export const getAggregatedRooms = async (): Promise<RoomInfo[]> => {
  const pool = getSfuPool();
  if (!pool.length) return [];

  const results = await Promise.all(pool.map(fetchSfuRooms));
  const merged = new Map<string, RoomInfo>();

  for (const rooms of results) {
    for (const room of rooms) {
      const existing = merged.get(room.id);
      if (existing) {
        existing.userCount += room.userCount;
      } else {
        merged.set(room.id, { ...room });
      }
    }
  }

  return Array.from(merged.values());
};

export const hasHealthySfu = async (): Promise<boolean> => {
  const pool = getSfuPool();
  if (!pool.length) return false;

  const statuses = await Promise.all(pool.map(fetchSfuStatus));
  return statuses.some((status) => status && !status.draining);
};
