"use client";

import { useEffect, useState } from "react";
import { NokiaSnakeGame } from "./components/addons/snake-game";

export default function SnakeClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <NokiaSnakeGame />;
}
