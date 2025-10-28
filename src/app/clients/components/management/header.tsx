import { ArrowLeft } from "lucide-react";

type Props = {
  onClick?: () => void;
};

const Header = ({ onClick }: Props) => {
  return (
    <div className="h-10 flex items-center pl-5 text-2xl font-semibold text-[#666363] shadow-[0px_0px_5px_4px_rgb(0,0,0,0.1)] w-full bg-[#D0D0D0]">
      <button type="button" onClick={onClick} className="hover:opacity-[70%]">
        <ArrowLeft />
      </button>
    </div>
  );
};

export default Header;
