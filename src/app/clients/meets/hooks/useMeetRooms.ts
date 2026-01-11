"use client";

import { useCallback, useState } from "react";
import type { RoomInfo } from "@/lib/sfu-types";
import { getSfuRooms } from "@/app/actions/sfu-rooms";

interface UseMeetRoomsOptions {
  isAdmin: boolean;
}

export function useMeetRooms({ isAdmin }: UseMeetRoomsOptions) {
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);
  const [roomsStatus, setRoomsStatus] = useState<"idle" | "loading" | "error">(
    "idle"
  );

  const refreshRooms = useCallback(async () => {
    if (!isAdmin) return;
    setRoomsStatus("loading");

    try {
      const data = await getSfuRooms();
      setAvailableRooms(Array.isArray(data.rooms) ? data.rooms : []);
      setRoomsStatus("idle");
    } catch (_error) {
      setRoomsStatus("error");
      setAvailableRooms([]);
    }
  }, [isAdmin]);

  return {
    availableRooms,
    roomsStatus,
    refreshRooms,
  };
}
