"use client";
import type { Domain, Meet, Meet_User, RoundUser, Slot } from "@prisma/client";
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
};

const SchedulerClient = ({ initialRounds }: SchedulerClientProps) => {
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
    [],
  );

  const getNotificationClasses = (type: "success" | "error") => {
    return type === "success"
      ? "bg-green-800 border-green-900"
      : "bg-red-800 border-red-900";
  };

  const participatingRounds = useMemo(() => {
    return allRounds.filter((r) => r.RoundUser && r.RoundUser.length > 0);
  }, [allRounds]);

  const availableDomains = useMemo(() => {
    return participatingRounds.map((r) => {
      if (r.domain === "cc") return "Competitive Coding";
      return r.domain.charAt(0).toUpperCase() + r.domain.slice(1);
    });
  }, [participatingRounds]);

  useEffect(() => {
    if (availableDomains.length > 0 && !selectedDomain) {
      setSelectedDomain(availableDomains[0]);
    } else if (
      availableDomains.length > 0 &&
      !availableDomains.includes(selectedDomain)
    ) {
      setSelectedDomain(availableDomains[0]);
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
  const [canJoin, setCanJoin] = useState(false);

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
      (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime(),
    );

    // Filter out past slots
    const now = new Date().getTime();
    const futureSlots = sortedSlots.filter(
      (s) => new Date(s.from).getTime() > now,
    );

    setSlots(futureSlots);
    setSelectedDate(null);
    setSelectedSlotId(null);
  }, [selectedRound]);

  const availableDates = Array.from(
    new Set(slots.map((s) => new Date(s.from).toDateString())),
  ).map((dateString) => new Date(dateString));

  const slotsForSelectedDate = selectedDate
    ? slots.filter(
        (s) => new Date(s.from).toDateString() === selectedDate.toDateString(),
      )
    : [];

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) || null;

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
      <div className="flex min-h-screen bg-black text-white font-sans items-center justify-center">
        <div className="flex flex-col items-center max-w-md text-center p-8">
          <h1 className="text-2xl font-medium mb-4">Interactions Scheduler</h1>
          <p className="text-gray-400 mb-8">
            You are not eligible for any interactions at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      {notification && (
        <div
          className={`fixed top-35 right-10 z-[1000] p-2 rounded-md shadow-xl text-white transition-opacity duration-300 ${getNotificationClasses(
            notification.type,
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
      <div className="flex-1 p-8 md:p-12 lg:p-16">
        <h1 className="text-2xl font-medium mb-8">
          {bookedSlot
            ? "Your scheduled interaction:"
            : "Choose your preferred date and slot:"}
        </h1>
        {bookedSlot ? (
          <div className="flex flex-col items-center justify-center h-[50vh] bg-[#111] border border-gray-800 rounded-xl p-8 max-w-2xl mx-auto">
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
            <div className="text-gray-500 text-sm">
              Link will be shared 15 min prior to the scheduled time.
            </div>
            {canJoin && meetLink && (
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 bg-[#5CAFFF] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#4a9ceb] transition-colors"
              >
                Join Meeting
              </a>
            )}
          </div>
        ) : selectedRound ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-6xl">
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
              />
              <SelectedSlot
                slot={selectedSlot}
                selectedDate={selectedDate}
                onConfirm={handleBookSlot}
                loading={bookingLoading}
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
