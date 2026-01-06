import clsx from "clsx";
import { Calendar as CalendarIcon } from "lucide-react";

type DomainOption = {
  name: string;
  roundNumber?: number;
};

type SidebarProps = {
  selectedDomain: string;
  onSelectDomain: (domain: string) => void;
  availableDomains: DomainOption[];
};

const Sidebar = ({
  selectedDomain,
  onSelectDomain,
  availableDomains,
}: SidebarProps) => {
  return (
    <div className="w-56 lg:w-64 bg-[#1c1c1c] p-6 lg:p-8 flex flex-col border-r border-[#2b2b2b] hidden md:flex">
      <div className="flex items-center gap-2 mb-12 text-white">
        <CalendarIcon className="w-5 h-5" />
        <span className="font-medium">Scheduler</span>
      </div>

      <div className="mb-6 text-gray-400 text-base font-semibold">
        Select Domain
      </div>

      <div className="flex flex-col gap-6">
        {availableDomains.map(({ name, roundNumber }) => {
          const label = roundNumber ? `${name} Round ${roundNumber}` : name;

          return (
          <button
            type="button"
            key={name}
            onClick={() => onSelectDomain(name)}
            className={clsx(
              "text-left text-sm transition-colors",
              selectedDomain === name
                ? "text-[#FF5C5C] font-medium"
                : "text-gray-300 hover:text-white",
            )}
          >
            <span>{label}</span>
          </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
