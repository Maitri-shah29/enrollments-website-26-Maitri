import { useEffect, useState } from "react";

export const useRotatingPlaceholder = (
  websites: string[],
  interval: number = 1000,
) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % websites.length);
    }, interval);

    return () => clearInterval(timer);
  }, [websites.length, interval]);

  return websites[currentIndex];
};
