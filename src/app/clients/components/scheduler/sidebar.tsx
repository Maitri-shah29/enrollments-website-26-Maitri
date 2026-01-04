import clsx from "clsx";
import { Calendar as CalendarIcon } from "lucide-react";

type SidebarProps = {
  selectedDomain: string;
  onSelectDomain: (domain: string) => void;
  availableDomains: string[];
};

const Sidebar = ({
  selectedDomain,
  onSelectDomain,
  availableDomains,
}: SidebarProps) => {
  return (
    <div className="w-64 bg-[#111] p-8 flex flex-col border-r border-gray-800 hidden md:flex">
      <div className="flex items-center gap-2 mb-12 text-white">
        <CalendarIcon className="w-5 h-5" />
        <span className="font-medium">Scheduler</span>
      </div>

      <div className="mb-6 text-gray-400 text-sm">Select Domain</div>

      <div className="flex flex-col gap-6">
        {availableDomains.map((domain) => (
          <button
            type="button"
            key={domain}
            onClick={() => onSelectDomain(domain)}
            className={clsx(
              "text-left text-sm transition-colors",
              selectedDomain === domain
                ? "text-[#FF5C5C] font-medium"
                : "text-white hover:text-gray-300",
            )}
          >
            {domain}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
