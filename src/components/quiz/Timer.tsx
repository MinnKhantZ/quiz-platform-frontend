import { useState, useEffect } from "react";
import { formatTime } from "../../lib/utils";

interface TimerProps {
  seconds: number;
  onTimeUp?: () => void;
  running?: boolean;
}

export default function Timer({ seconds, onTimeUp, running = true }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const isFinished = timeLeft <= 0;

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running || isFinished) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, isFinished, onTimeUp]);

  const percentage = (timeLeft / seconds) * 100;
  const isLow = timeLeft <= 10;

  return (
    <div className="flex items-center gap-3">
      <div className={`text-lg font-mono font-bold ${isLow ? "text-red-500 animate-pulse" : "text-foreground"}`}>
        {formatTime(timeLeft)}
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${isLow ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
