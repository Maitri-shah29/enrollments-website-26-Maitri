import type { Slot } from "@prisma/client";

type SelectedSlotProps = {
  slot: Slot | null;
  selectedDate: Date | null;
  onConfirm: () => void;
  loading?: boolean;
};

const SelectedSlot = ({
  slot,
  selectedDate,
  onConfirm,
  loading,
}: SelectedSlotProps) => {
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

  const displayDate = selectedDate ? formatDate(selectedDate) : "Select a date";
  const displayTime = slot
    ? `${formatTime(slot.from)} - ${formatTime(slot.to)}`
    : "";

  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-xl p-6 flex flex-col items-center justify-between min-h-[150px]">
      <div className="text-gray-200 mb-4">Selected Slot</div>

      <div className="text-gray-400 text-sm mb-6 text-center">
        {selectedDate && slot
          ? `${displayDate} • ${displayTime}`
          : "Please select a date and slot"}
      </div>

      <button
        type="button"
        disabled={!slot || loading}
        onClick={onConfirm}
        className="bg-white text-[#0f1a2a] font-medium py-2 px-8 rounded border border-[#5CAFFF] hover:bg-[#e8f4ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Confirming..." : "Confirm Slot"}
      </button>
    </div>
  );
};

export default SelectedSlot;
