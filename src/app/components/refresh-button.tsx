"use client";
import Image from "next/image";

type RefreshButtonProps = {
  className?: string;
  title?: string;
  onRefresh?: () => void;
};
export default function RefreshButton({
  className,
  title = "Refresh page",
  onRefresh,
}: RefreshButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger animation by removing and re-adding the class
    const img = e.currentTarget.querySelector("img");
    if (img) {
      img.classList.remove("animate-spin-once");
      void img.offsetWidth; // Force reflow
      img.classList.add("animate-spin-once");
    }

    // Call parent's refresh handler if provided
    if (onRefresh) {
      onRefresh();
      return;
    }

    // Default behavior: reload iframe
    const iframe = document.querySelector(
      'iframe[title="Browser Tab"]',
    ) as HTMLIFrameElement;
    if (iframe?.src) {
      const currentSrc = iframe.src;
      iframe.src = currentSrc;
    }
  };

  return (
    <button
      type="button"
      aria-label="Refresh page"
      title={title}
      onClick={handleClick}
      className={`${className} transition-transform duration-200 hover:scale-110`}
    >
      <Image
        src="/refresh-button.svg"
        alt="Refresh"
        width={16}
        height={16}
        className="w-4 h-4"
      />
    </button>
  );
}
