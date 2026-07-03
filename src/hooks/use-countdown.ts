"use client";

import { useState, useEffect, useRef } from "react";

export function useCountdown(endsAt: string | undefined) {
  const getRemaining = () => {
    if (!endsAt) return 0;
    return Math.max(0, new Date(endsAt).getTime() - Date.now());
  };

  const [remaining, setRemaining] = useState(getRemaining);
  const rafRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!endsAt) return;
    setRemaining(getRemaining());

    rafRef.current = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r <= 0 && rafRef.current) {
        clearInterval(rafRef.current);
        rafRef.current = null;
      }
    }, 1000);

    return () => {
      if (rafRef.current) clearInterval(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    remaining,
    hours,
    minutes,
    seconds,
    isExpired: remaining <= 0,
    formatted: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  };
}
