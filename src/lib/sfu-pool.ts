import type { RoomInfo } from "./sfu-types";

export interface SfuInstance {
  id: string;
  url: string;
}

export interface SfuStatus {
  instanceId: string;
  version: string;
  draining: boolean;
  rooms: number;
  uptime: number;
}

const DEFAULT_SFU_URL =
  process.env.NEXT_PUBLIC_SFU_URL || "http://localhost:3031";
const SFU_SECRET = process.env.SFU_SECRET || "development-secret";

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs = 3000,
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const buildSfuHeaders = (): HeadersInit => ({
  "x-sfu-secret": SFU_SECRET,
});

const parseSfuPool = (raw: string): SfuInstance[] => {
  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!entries.length) {
    return [{ id: "default", url: DEFAULT_SFU_URL }];
  }

  return entries
    .map((entry, index) => {
      const [left, right] = entry.split("=").map((part) => part.trim());
      if (!left) return null;

      if (right) {
        return { id: left, url: right };
      }

      return { id: `sfu-${index + 1}`, url: left };
    })
    .filter((entry): entry is SfuInstance => Boolean(entry?.url));
};

export const getSfuPool = (): SfuInstance[] => {
  const pool = parseSfuPool(process.env.SFU_POOL || "");
  return pool.length ? pool : [{ id: "default", url: DEFAULT_SFU_URL }];
};

export const fetchSfuStatus = async (
  instance: SfuInstance,
): Promise<SfuStatus | null> => {
  try {
    const response = await fetchWithTimeout(
      `${instance.url}/status`,
      { headers: buildSfuHeaders(), cache: "no-store" },
      2500,
    );

    if (!response.ok) return null;

    const data = (await response.json()) as Partial<SfuStatus>;
    if (!data || typeof data.instanceId !== "string") return null;

    return {
      instanceId: data.instanceId,
      version: data.version ?? "unknown",
      draining: Boolean(data.draining),
      rooms: Number(data.rooms ?? 0),
      uptime: Number(data.uptime ?? 0),
    };
  } catch (_error) {
    return null;
  }
};

export const fetchSfuRooms = async (
  instance: SfuInstance,
): Promise<RoomInfo[]> => {
  const url = `${instance.url}/rooms`;
  console.log(`[fetchSfuRooms] Fetching from: ${url}`);

  try {
    const response = await fetchWithTimeout(
      url,
      { headers: buildSfuHeaders(), cache: "no-store" },
      2500,
    );

    console.log(`[fetchSfuRooms] Response status: ${response.status}`);

    if (!response.ok) {
      console.log(`[fetchSfuRooms] Response not ok: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    console.log(`[fetchSfuRooms] Raw data:`, JSON.stringify(data));

    const rooms = Array.isArray(data?.rooms) ? data.rooms : [];
    console.log(`[fetchSfuRooms] Parsed ${rooms.length} rooms`);

    return rooms.map((room: { id: string; clients?: number }) => ({
      id: room.id,
      userCount: Number(room.clients ?? 0),
    }));
  } catch (error) {
    console.error(`[fetchSfuRooms] Error fetching rooms:`, error);
    return [];
  }
};

export const roomExistsOnSfu = async (
  instance: SfuInstance,
  roomId: string,
): Promise<boolean> => {
  const rooms = await fetchSfuRooms(instance);
  return rooms.some((room) => room.id === roomId);
};
