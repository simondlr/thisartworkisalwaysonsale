"use client";

import { useEffect, useState } from "react";

// Current unix time in seconds, re-rendering every intervalMs so time-based state (patronage owed,
// foreclosure) stays current without refetching anything.
export function useNow(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
