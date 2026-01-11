"use client";

import { useCallback, useEffect, useState } from "react";
import fetchMeetUser from "@/app/actions/fetch-meet-user";
import type { MeetingSlotOption } from "../types";
import { pickDefaultSlot } from "../utils";

interface UseMeetSlotsOptions {
  initialRoomId?: string;
  isAdmin: boolean;
  session:
    | {
        data?: {
          user?: {
            name?: string | null;
            email?: string | null;
          };
        };
      }
    | null;
  setRoomId: (roomId: string) => void;
}

export function useMeetSlots({
  initialRoomId,
  isAdmin,
  session,
  setRoomId,
}: UseMeetSlotsOptions) {
  const [userSlotOptions, setUserSlotOptions] = useState<MeetingSlotOption[]>(
    []
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [userMeetingStatus, setUserMeetingStatus] = useState<
    "loading" | "has-slot" | "needs-booking" | "not-enrolled"
  >("loading");
  const [slotInfoLoaded, setSlotInfoLoaded] = useState(false);

  useEffect(() => {
    if (session === null || isAdmin === undefined) return;
    if (isAdmin) {
      setUserMeetingStatus("has-slot");
      return;
    }
    if (slotInfoLoaded) return;

    const loadSlotInfo = async () => {
      try {
        const result = await fetchMeetUser();
        if ("success" in result && result.success) {
          const slots = result.meetLinks
            .filter((meetLink) => meetLink.slot)
            .map((meetLink) => {
              const domainName =
                meetLink.domain === "cc"
                  ? "Competitive Coding"
                  : meetLink.domain.charAt(0).toUpperCase() +
                    meetLink.domain.slice(1);
              const from = new Date(meetLink.slot!.from);
              const to = new Date(meetLink.slot!.to);
              const fromKey = Number.isNaN(from.getTime())
                ? String(meetLink.slot!.from)
                : String(from.getTime());

              return {
                id: `${meetLink.domain}-${fromKey}`,
                domain: domainName,
                from,
                to,
                meetLink: meetLink.meetLink,
              } as MeetingSlotOption;
            })
            .sort((a, b) => a.from.getTime() - b.from.getTime());

          if (slots.length > 0) {
            setUserSlotOptions(slots);
            const defaultSlot = pickDefaultSlot(slots, initialRoomId);
            if (defaultSlot) {
              setSelectedSlotId(defaultSlot.id);
              setRoomId(defaultSlot.meetLink);
            } else {
              setSelectedSlotId(null);
            }
            setUserMeetingStatus("has-slot");
          } else if (result.meetLinks.length > 0) {
            setUserSlotOptions([]);
            setSelectedSlotId(null);
            setUserMeetingStatus("needs-booking");
          } else {
            setUserSlotOptions([]);
            setSelectedSlotId(null);
            setUserMeetingStatus("not-enrolled");
          }
        } else {
          setUserSlotOptions([]);
          setSelectedSlotId(null);
          setUserMeetingStatus("not-enrolled");
        }
      } catch (error) {
        console.warn("[Meets] Failed to load slot info:", error);
        setUserSlotOptions([]);
        setSelectedSlotId(null);
        setUserMeetingStatus("not-enrolled");
      } finally {
        setSlotInfoLoaded(true);
      }
    };

    loadSlotInfo();
  }, [initialRoomId, isAdmin, session, slotInfoLoaded, setRoomId]);

  useEffect(() => {
    if (isAdmin) return;
    if (userSlotOptions.length === 0) return;
    if (
      selectedSlotId &&
      userSlotOptions.some((slot) => slot.id === selectedSlotId)
    ) {
      return;
    }
    const fallbackSlot = pickDefaultSlot(userSlotOptions, initialRoomId);
    if (!fallbackSlot) return;
    setSelectedSlotId(fallbackSlot.id);
    setRoomId(fallbackSlot.meetLink);
  }, [initialRoomId, isAdmin, selectedSlotId, userSlotOptions, setRoomId]);

  const handleSlotSelect = useCallback(
    (slotId: string) => {
      setSelectedSlotId(slotId);
      const selected = userSlotOptions.find((slot) => slot.id === slotId);
      if (selected) {
        setRoomId(selected.meetLink);
      }
    },
    [userSlotOptions, setRoomId]
  );

  return {
    userSlotOptions,
    selectedSlotId,
    userMeetingStatus,
    handleSlotSelect,
  };
}
