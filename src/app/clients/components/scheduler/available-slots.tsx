import type { Slot } from "@prisma/client";
import clsx from "clsx";

type AvailableSlotsProps = {
  selectedSlot: string | null;
  onSelectSlot: (slotId: string) => void;
  slots: Slot[];
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(new Date(date));
};

const AvailableSlots = ({
  selectedSlot,
  onSelectSlot,
  slots,
}: AvailableSlotsProps) => {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
      <div className="text-center mb-6 text-gray-300">Available Slots</div>
      <div className="grid grid-cols-2 gap-4">
        {slots.length === 0 ? (
          <div className="col-span-2 text-center text-gray-500 py-4">
            No slots available for this date
          </div>
        ) : (
          slots.map((slot) => {
            const isSelected = selectedSlot === slot.id;
            const timeRange = `${formatTime(slot.from)} - ${formatTime(slot.to)}`;

            return (
              <button
                type="button"
                key={slot.id}
                onClick={() => onSelectSlot(slot.id)}
                disabled={slot.capacity <= 0}
                className={clsx(
                  "py-2 px-4 rounded-lg text-sm font-medium transition-colors border flex flex-col items-center justify-center gap-1",
                  isSelected
                    ? "bg-[#5CAFFF] text-black border-[#5CAFFF]"
                    : "bg-white text-black border-white hover:bg-gray-200",
                  slot.capacity <= 0 &&
                    "opacity-50 cursor-not-allowed bg-gray-300 hover:bg-gray-300",
                )}
              >
                <span>{timeRange}</span>
                <span className="text-xs opacity-80 font-normal">
                  {slot.capacity > 0 ? `${slot.capacity} spots left` : "Full"}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AvailableSlots;
