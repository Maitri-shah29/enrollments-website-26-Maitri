"use client";

interface FolderDesignBigProps {
  title: string;
  description: string;
  color: string;
  onClose: () => void;
}

const FolderDesignBig = ({
  title,
  description,
  color,
  onClose,
}: FolderDesignBigProps) => {
  return (
    <button
      type="button"
      tabIndex={0}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-8"
      onClick={onClose} // use onClick, NOT onSubmit
      onKeyDown={(e) => {
        if (e.key === "Escape" || e.key === "Enter") {
          onClose();
        }
      }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0px, transparent 104px, black 114px, black 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0px, transparent 104px, black 114px, black 100%)",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-w-2xl w-[92%] pointer-events-none"
      >
        {/* Background Folder Image */}
        <div className="relative w-full h-[400px] md:h-[400px] flex items-center justify-center translate-y-16">
          {/* Background Folder (behind, slightly above) */}
          <svg
            viewBox="0 0 300 180"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 h-full w-full -translate-y-5 translate-x-5 bg-blur"
          >
            <title>Folder Background</title>
            <path
              d="M 25 0 L 180 0 C 195 0 200 35 220 35 L 275 35 C 288.8 35 300 46.2 300 60 L 300 155 C 300 168.8 288.8 180 275 180 L 25 180 C 11.2 180 0 168.8 0 155 L 0 25 C 0 11.2 11.2 0 25 0 Z"
              fill={color}
              opacity={0.7}
            />
          </svg>
          {/* Main Folder */}
          <svg
            viewBox="0 0 300 180"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 h-full w-full pointer-events-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <title>Folder</title>
            <path
              d="M 25 0 L 180 0 C 195 0 200 35 220 35 L 275 35 C 288.8 35 300 46.2 300 60 L 300 155 C 300 168.8 288.8 180 275 180 L 25 180 C 11.2 180 0 168.8 0 155 L 0 25 C 0 11.2 11.2 0 25 0 Z"
              fill={color}
            />
          </svg>
          <div
            className="absolute inset-0 flex flex-col justify-center px-6 md:px-8 py-6 md:py-8 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <h2 className="text-white font-bold text-4xl md:text-5xl mb-4 md:mb-6 drop-shadow-lg">
              {title}
            </h2>

            {/* Divider Line */}
            <div className="w-full h-[2px] bg-white/60 mb-6" />

            {/* Description */}
            <p className="text-white text-lg md:text-xl leading-relaxed drop-shadow-md">
              {description}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
};

export default FolderDesignBig;
