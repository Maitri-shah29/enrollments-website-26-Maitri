"use client";

import { useEffect, useState } from "react";
import PintooRun from "./components/addons/PintooRun";

export default function PintooRunClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <PintooRun />;
}
