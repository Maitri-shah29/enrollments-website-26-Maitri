"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface InstructionsProps {
  onGetStarted: () => void;
}

const images = [1, 2, 3, 4, 5, 6];

const Instructions: React.FC<InstructionsProps> = ({ onGetStarted }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const index = Math.round(el.scrollTop / el.clientHeight);
      setActiveIndex(index);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (index: number) => {
    slideRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="absolute inset-0 z-10 bg-black">
      <div
        ref={containerRef}
        className="
          h-full w-full overflow-y-auto
          snap-y snap-mandatory
          scroll-smooth
          scrollbar-none
        "
      >
        {images.map((num, i) => (
          <div
            key={num}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            className="
      relative h-full w-full
      snap-start
      flex items-center justify-center
      overflow-hidden
    "
          >
            {/* Blurred background */}
            <Image
              src={`/images/instructions/${num}.svg`}
              alt=""
              fill
              priority={num === 1}
              className="
        object-cover
        scale-110
        blur-2xl
        opacity-60
      "
            />

            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Foreground image */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <Image
                src={`/images/instructions/${num}.svg`}
                alt={`Instruction ${num}`}
                width={1100}
                height={1100}
                className="
                shadow-[0_0_36px_rgba(255,255,255,0.2)]
          object-cover
          max-h-[85%]
          max-w-[85%]
        "
              />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        {images.map((_, i) => (
          <button
            type="button"
            key={i}
            onClick={() => goTo(i)}
            className={`
              w-2.5 h-2.5 rounded-full transition-all
              ${i === activeIndex ? "bg-white scale-125" : "bg-white/40"}
            `}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <button
          type="button"
          onClick={onGetStarted}
          className="
            px-6 py-3 rounded-xl font-bold text-lg
            bg-white/20 backdrop-blur
            border border-white/30
            text-white
            transition-all
            hover:shadow-[0_0_12px_rgba(255,255,255,0.7)]
            z-10
          "
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
};

export default Instructions;
