import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type CalendarProps = {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  availableDates: Date[];
};

const Calendar = ({
  selectedDate,
  onSelectDate,
  availableDates,
}: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setCurrentMonth(availableDates[0]);
    } else if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [availableDates, selectedDate]);

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const renderDays = () => {
    const grid = [];
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);

    for (let i = 0; i < firstDay; i++) {
      grid.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        d,
      );
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      const isAvailable = availableDates.some(
        (availableDate) => availableDate.toDateString() === date.toDateString(),
      );

      let bgColor = "transparent";
      let textColor = "text-white";

      if (isSelected) {
        bgColor = "bg-[#FF5C5C]"; // Reddish
        textColor = "text-white";
      } else if (isAvailable) {
        bgColor = "bg-[#9D8CFF]"; // Purpleish
        textColor = "text-white";
      } else {
        textColor = "text-gray-600"; // Unavailable
      }

      grid.push(
        <button
          type="button"
          key={d}
          onClick={() => isAvailable && onSelectDate(date)}
          disabled={!isAvailable}
          className={clsx(
            "w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors",
            bgColor,
            textColor,
            isAvailable && !isSelected && "hover:bg-gray-800",
            !isAvailable && "cursor-not-allowed",
          )}
        >
          {d}
        </button>,
      );
    }
    return grid;
  };

  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-8">
      <div className="text-center mb-8 text-gray-300">Available Dates</div>

      <div className="flex items-center justify-between mb-8 px-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-800 rounded"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-white font-medium">{monthName}</span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-800 rounded"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-4 justify-items-center mb-4">
        {days.map((day) => (
          <div
            key={day}
            className="text-gray-400 text-xs font-medium tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-4 justify-items-center">
        {renderDays()}
      </div>
    </div>
  );
};

export default Calendar;
