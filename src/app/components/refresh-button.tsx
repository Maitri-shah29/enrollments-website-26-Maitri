"use client";

import React from "react";

type RefreshButtonProps = {
  className?: string;
  title?: string;
};

export default function RefreshButton({
  className,
  title = "Refresh page",
}: RefreshButtonProps) {
  const handleClick = () => {
    const iframe = document.querySelector(
      'iframe[title="Browser Tab"]',
    ) as HTMLIFrameElement;
    if (iframe && iframe.src) {
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
      className={className}
    >
      <img
        src="/refresh-button.svg"
        alt=""
        aria-hidden="true"
        className="w-5 h-5"
      />
    </button>
  );
}
