"use client";

import { useState, useEffect, useCallback } from "react";

interface TimerDisplayProps {
  durationSeconds: number;
}

export default function TimerDisplay({ durationSeconds }: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (!isRunning || !startTime) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const toggle = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      if (!startTime) {
        setStartTime(Date.now());
      } else {
        setStartTime(Date.now() - elapsed * 1000);
      }
      setIsRunning(true);
    }
  }, [isRunning, startTime, elapsed]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    setStartTime(null);
  }, []);

  const remaining = Math.max(0, durationSeconds - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = durationSeconds > 0 ? elapsed / durationSeconds : 0;
  const isOvertime = elapsed > durationSeconds;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`font-mono text-2xl font-bold tabular-nums ${
          isOvertime
            ? "text-red-400 animate-pulse"
            : remaining <= 30
              ? "text-yellow-400"
              : "text-white"
        }`}
      >
        {isOvertime ? "-" : ""}
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>

      {/* Progress bar */}
      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isOvertime
              ? "bg-red-500"
              : progress > 0.8
                ? "bg-yellow-500"
                : "bg-green-500"
          }`}
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>

      {/* Controls */}
      <button
        onClick={toggle}
        className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
      >
        {isRunning ? "⏸" : "▶"}
      </button>
      <button
        onClick={reset}
        className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
      >
        ↺
      </button>
    </div>
  );
}
