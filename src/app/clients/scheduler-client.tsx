"use client";
import type {
  Domain,
  Meet,
  Meet_User,
  Round,
  RoundUser,
  Slot,
} from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { bookSlot } from "@/app/actions/book-slot";
import fetchInterviewRounds from "@/app/actions/fetch-slots";
import AvailableSlots from "./components/scheduler/available-slots";
import Calendar from "./components/scheduler/calendar";
import SelectedSlot from "./components/scheduler/selected-slot";
import Sidebar from "./components/scheduler/sidebar";

type RoundWithRelations = {
  id: string;
  domain: Domain;
  number: number;
  Meet: (Meet & { Slot: Slot[] }) | null;
  RoundUser: (RoundUser & {
    round: Pick<Round, "number">;
    Meet_User:
      | (Meet_User & {
          slot: Slot & {
            meet: Meet | null;
          };
        })
      | null;
  })[];
};

type SchedulerClientProps = {
  initialRounds: RoundWithRelations[];
  initialSfuHealth: boolean;
};

type DomainOption = {
  name: string;
  roundNumber?: number;
};

const SchedulerClient = ({
  initialRounds,
  initialSfuHealth,
}: SchedulerClientProps) => {
  const SLOT_VISIBILITY_GRACE_MS = 3 * 60 * 60 * 1000;
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [allRounds, setAllRounds] =
    useState<RoundWithRelations[]>(initialRounds);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = useCallback(
    (message: string, type: "success" | "error") => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    },
    []
  );

  const getNotificationClasses = (type: "success" | "error") => {
    return type === "success"
      ? "bg-green-800 border-green-900"
      : "bg-red-800 border-red-900";
  };

  const participatingRounds = useMemo(() => {
    return allRounds.filter((r) => r.RoundUser && r.RoundUser.length > 0);
  }, [allRounds]);

  const availableDomains = useMemo<DomainOption[]>(() => {
    return participatingRounds.map((r) => {
      const name =
        r.domain === "cc"
          ? "Competitive Coding"
          : r.domain.charAt(0).toUpperCase() + r.domain.slice(1);

      const roundNumber = r.RoundUser?.[0]?.round?.number ?? r.number;

      return { name, roundNumber };
    });
  }, [participatingRounds]);

  useEffect(() => {
    if (availableDomains.length > 0 && !selectedDomain) {
      setSelectedDomain(availableDomains[0].name);
    } else if (
      availableDomains.length > 0 &&
      !availableDomains.some((domain) => domain.name === selectedDomain)
    ) {
      setSelectedDomain(availableDomains[0].name);
    }
  }, [availableDomains, selectedDomain]);

  const selectedRound = useMemo(() => {
    if (!selectedDomain) return null;
    let domainEnum: Domain;
    const normalizedDomain = selectedDomain.toLowerCase();

    if (normalizedDomain === "competitive coding") {
      domainEnum = "cc" as Domain;
    } else {
      domainEnum = normalizedDomain as Domain;
    }
    return participatingRounds.find((r) => r.domain === domainEnum);
  }, [selectedDomain, participatingRounds]);

  const bookedSlot = selectedRound?.RoundUser?.[0]?.Meet_User?.slot;
  const meetLink = bookedSlot?.meet?.meetLink;
  const schedulingLink = bookedSlot?.meet?.schedulingLink;
  const [canJoin, setCanJoin] = useState(false);
  const [isSfuHealthy, setIsSfuHealthy] = useState(initialSfuHealth);
  const [healthCheckCompleted, setHealthCheckCompleted] = useState(false);

  useEffect(() => {
    const sfuUrl = process.env.NEXT_PUBLIC_SFU_URL || "http://localhost:3031";

    const checkSfuHealth = async () => {
      try {
        const response = await fetch(`${sfuUrl}/health`);
        if (response.ok) {
          const data = await response.json();
          setIsSfuHealthy(data.status === "healthy");
        } else {
          setIsSfuHealthy(false);
        }
      } catch (error) {
        setIsSfuHealthy(false);
        console.log(error);
      }
      setHealthCheckCompleted(true);
    };

    checkSfuHealth();

    const interval = setInterval(checkSfuHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!bookedSlot) {
      setCanJoin(false);
      return;
    }

    const checkTime = () => {
      const now = Date.now();
      const slotTime = new Date(bookedSlot.from).getTime();
      const fifteenMinutes = 15 * 60 * 1000;
      setCanJoin(now >= slotTime - fifteenMinutes);
    };

    checkTime();
    const interval = setInterval(checkTime, 10000);

    return () => clearInterval(interval);
  }, [bookedSlot]);

  const handleBookSlot = async () => {
    if (!selectedSlotId || !selectedRound) return;

    const roundUserId = selectedRound.RoundUser[0].id;
    setBookingLoading(true);

    const result = await bookSlot(selectedSlotId, roundUserId);

    if (result === "success") {
      // Refresh data to update slot capacity/availability
      const refreshResult = await fetchInterviewRounds();
      if (!("error" in refreshResult)) {
        setAllRounds(refreshResult.rounds);
        showNotification("Slot booked successfully!", "success");
      } else {
        showNotification("Some error has occured, refresh the page", "error");
      }
      setSelectedSlotId(null);
    } else {
      showNotification(result, "error");
    }

    setBookingLoading(false);
  };

  useEffect(() => {
    const roundSlots = selectedRound?.Meet?.Slot || [];

    // Sort slots by time
    const sortedSlots = [...roundSlots].sort(
      (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime()
    );

    const now = Date.now();
    const futureSlots = sortedSlots.filter(
      (s) => new Date(s.to).getTime() + SLOT_VISIBILITY_GRACE_MS > now
    );

    setSlots(futureSlots);
    setSelectedDate(null);
    setSelectedSlotId(null);
  }, [selectedRound]);

  const availableDates = Array.from(
    new Set(slots.map((s) => new Date(s.from).toDateString()))
  ).map((dateString) => new Date(dateString));

  useEffect(() => {
    if (!selectedRound) return;

    const storageKey = `scheduler-selected-date:${selectedRound.id}`;

    if (selectedDate) {
      sessionStorage.setItem(storageKey, selectedDate.toDateString());
      return;
    }

    if (availableDates.length === 0) {
      return;
    }

    const storedDate = sessionStorage.getItem(storageKey);
    if (!storedDate) return;

    const restoredDate = new Date(storedDate);
    const isAvailable = availableDates.some(
      (date) => date.toDateString() === restoredDate.toDateString()
    );

    if (isAvailable) {
      setSelectedDate(restoredDate);
    } else {
      sessionStorage.removeItem(storageKey);
      showNotification(
        "Previously selected date is no longer available.",
        "error"
      );
    }
  }, [availableDates, selectedDate, selectedRound, showNotification]);

  const slotsForSelectedDate = selectedDate
    ? slots.filter(
        (s) => new Date(s.from).toDateString() === selectedDate.toDateString()
      )
    : [];

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) || null;
  const selectedSlotBookable = selectedSlot
    ? selectedSlot.capacity > 0 &&
      new Date(selectedSlot.from).getTime() > Date.now()
    : false;

  const formatDate = (date: Date) => {
    const d = date.getDate();
    const m = date.toLocaleString("default", { month: "short" });
    const y = date.getFullYear();

    let suffix = "th";
    if (d % 10 === 1 && d !== 11) suffix = "st";
    else if (d % 10 === 2 && d !== 12) suffix = "nd";
    else if (d % 10 === 3 && d !== 13) suffix = "rd";

    return `${d}${suffix} ${m} ${y}`;
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(new Date(date));
  };

  if (participatingRounds.length === 0) {
    return (
      <div className="flex min-h-screen bg-black text-white font-[var(--font-poppins)] items-center justify-center">
        <div className="flex flex-col items-center max-w-md text-center p-8">
          <h1 className="text-2xl font-medium mb-4">Interactions Scheduler</h1>
          <p className="text-gray-400 mb-8">
            You are not eligible for any interactions at the moment.
          </p>
        </div>
      </div>
    );
  }

  const activeLink = healthCheckCompleted
    ? isSfuHealthy
      ? meetLink
      : schedulingLink
    : null;

  return (
    <div className="flex min-h-[100dvh] overflow-x-hidden bg-black text-white font-[var(--font-poppins)]">
      {notification && (
        <div
          className={`fixed top-35 right-10 z-[1000] p-2 rounded-md shadow-xl text-white transition-opacity duration-300 ${getNotificationClasses(
            notification.type
          )} border-2`}
        >
          {notification.message}
        </div>
      )}
      <Sidebar
        selectedDomain={selectedDomain}
        onSelectDomain={setSelectedDomain}
        availableDomains={availableDomains}
      />
      <div className="flex-1 p-4 sm:p-6 md:p-10 lg:p-12 xl:p-14">
        <h1 className="text-xl sm:text-2xl font-medium mb-6 sm:mb-8">
          {bookedSlot
            ? "Your scheduled interaction:"
            : "Choose your preferred date and slot:"}
        </h1>
        <div className="md:hidden mb-6">
          <label className="block text-sm text-gray-400 font-semibold mb-2">
            Select Domain
          </label>
          <select
            value={selectedDomain}
            onChange={(event) => setSelectedDomain(event.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2b2b2b] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#5CAFFF] transition-colors"
          >
            {availableDomains.map(({ name, roundNumber }) => {
              const label = roundNumber ? `${name} Round ${roundNumber}` : name;
              return (
                <option key={name} value={name}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
        {bookedSlot ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] h-auto bg-[#111] border border-gray-800 rounded-xl p-8 max-w-2xl mx-auto">
            <div className="text-gray-400 mb-2">
              You have successfully booked a slot for
            </div>
            <div className="text-3xl font-bold mb-4 text-[#5CAFFF]">
              {selectedDomain} Interaction
            </div>
            <div className="text-xl mb-2">
              {formatDate(new Date(bookedSlot.from))}
            </div>
            <div className="text-2xl font-medium mb-8">
              {formatTime(new Date(bookedSlot.from))} -{" "}
              {formatTime(new Date(bookedSlot.to))}
            </div>
            <div className="text-gray-500 text-sm mb-4">
              Link will be shared 15 min prior to the scheduled time.
            </div>
            {canJoin && !healthCheckCompleted && (
              <div className="text-gray-400 text-sm mb-4">
                Checking meeting service availability...
              </div>
            )}
            {canJoin && activeLink && (
              <div className="bg-gray-800/50 p-4 rounded-lg mb-6 border border-gray-700 max-w-md w-full">
                <div className="text-sm text-gray-400 mb-2">
                  {isSfuHealthy
                    ? 'Use this Room ID inside the Meets website "meets.com" inside the ACM Explore Browser or click on the button below to join the meeting.'
                    : "The internal meeting service is currently unavailable. Please use the following backup link to join your meeting."}
                </div>
                <div className="flex items-center justify-between bg-black/50 p-3 rounded border border-gray-800">
                  <span className="font-mono text-[#FF5C5C] font-medium break-all mr-2">
                    {activeLink}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeLink);
                      showNotification("Link copied!", "success");
                    }}
                    className="text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            {canJoin && activeLink && isSfuHealthy && (
              <button
                onClick={() => {
                  window.postMessage(
                    {
                      type: "SWITCH_TAB",
                      url: "meets",
                      meetingId: activeLink,
                    },
                    "*"
                  );
                }}
                className="mt-6 bg-[#FF5C5C] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#ff7b7b] transition-colors"
              >
                Join Meeting
              </button>
            )}
            {canJoin && activeLink && !isSfuHealthy && (
              <a
                href={activeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 bg-[#FF5C5C] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#ff7b7b] transition-colors inline-block"
              >
                Go to Meeting
              </a>
            )}
          </div>
        ) : selectedRound ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-6 md:gap-8 w-full max-w-5xl xl:max-w-6xl mx-auto">
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              availableDates={availableDates}
            />
            <div className="space-y-8">
              <AvailableSlots
                selectedSlot={selectedSlotId}
                onSelectSlot={setSelectedSlotId}
                slots={slotsForSelectedDate}
                hasSelectedDate={!!selectedDate}
              />
              <SelectedSlot
                slot={selectedSlot}
                selectedDate={selectedDate}
                onConfirm={handleBookSlot}
                loading={bookingLoading}
                isBookable={selectedSlotBookable}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[60vh]">
            <p className="text-xl text-gray-400">
              Select a domain to view slots.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulerClient;
