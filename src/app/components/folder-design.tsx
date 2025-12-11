"use client";

import Image from "next/image";

interface FolderDesignProps {
  title: string;
  logo: string;
  bgColor: string;
  textColor: string;
  onClick?: () => void;
}

const FolderDesign = ({
  title,
  logo,
  bgColor,
  textColor,
  onClick,
}: FolderDesignProps) => {
  return (
    <button
      tabIndex={0}
      type="button"
      className="relative cursor-pointer group transition-all duration-300 hover:scale-105"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Logo popping out upwards */}
      <div className="relative w-full h-20 mb-2 flex items-center justify-center z-30">
        <Image
          src={logo}
          alt={title}
          width={100}
          height={100}
          className="object-contain drop-shadow-2xl"
        />
      </div>

      {/* Darker background div */}
      <div
        className="relative rounded-2xl p-4 pb-2"
        style={{ backgroundColor: bgColor }}
      >
        {/* Folder Body */}
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="158"
            height="172"
            viewBox="0 0 158 172"
            fill="none"
            className="w-full h-auto"
          >
            <title>Folder Body</title>

            <path
              d="M85.9931 12.5767L27.452 33.4226C23.184 34.9403 20.0545 38.6222 19.2323 43.0804L7.94506 104.283C7.12287 108.741 8.73304 113.297 12.1789 116.238L59.4327 156.595C62.8786 159.535 67.6182 160.409 71.8863 158.891L130.427 138.046C134.695 136.528 137.825 132.846 138.647 128.388L149.934 67.185C150.757 62.7268 149.146 58.1708 145.7 55.2304L98.4588 14.8757C95.0129 11.9353 90.2612 11.059 85.9931 12.5767Z"
              fill="#FAFBFB"
            />
            <path
              d="M129.627 129.029L141.735 63.3799L91.047 20.0848L28.2499 42.4506L16.1427 108.099L66.8325 151.382L129.627 129.029Z"
              fill="#2C2C2C"
              stroke="#48BA86"
              strokeWidth="0.64674"
              strokeMiterlimit="10"
            />
            <path
              d="M87.6637 38.828L42.812 54.7952L42.774 55.0012L79.0128 85.7356L87.6637 38.828Z"
              fill="#D3EBE0"
            />
            <path
              d="M79.0137 85.7344L70.3628 132.642L70.3968 132.661L115.277 116.674L115.308 116.504L79.0137 85.7344Z"
              fill="#5EBF94"
            />
            <path
              d="M79.0142 85.7344L42.7754 55L34.1647 101.69L79.0142 85.7344Z"
              fill="#48BA86"
            />
            <path
              d="M34.1648 101.689L34.1604 101.714L70.3634 132.642L79.0143 85.7342L34.1648 101.689Z"
              fill="#ADDBC8"
            />
            <path
              d="M123.955 69.7456L79.0071 85.7578L87.667 38.8018L123.955 69.7456Z"
              fill="#86CCAC"
            />
          </svg>

          {/* Title overlay on folder */}
          <div className="absolute inset-0 flex items-center justify-center pt-8">
            <h3
              className="font-bold text-xl text-center px-4 drop-shadow-lg"
              style={{ color: textColor }}
            >
              {title}
            </h3>
          </div>
        </div>
      </div>
    </button>
  );
};

export default FolderDesign;
