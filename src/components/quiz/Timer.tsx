import { useState, useEffect } from "react";
import { formatTime } from "../../lib/utils";
import { cn } from "../../lib/utils";
import { Clock } from "lucide-react";

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
  const isCritical = timeLeft <= 5;

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors",
      isCritical ? "border-destructive/40 bg-destructive/10" : isLow ? "border-primary/30 bg-primary/5" : "border-border bg-card"
    )}>
      <Clock className={cn(
        "h-4 w-4 shrink-0",
        isCritical ? "text-destructive animate-pulse" : isLow ? "text-primary" : "text-muted-foreground"
      )} />
      <span className={cn(
        "font-mono font-bold text-lg tabular-nums",
        isCritical ? "text-destructive" : isLow ? "text-primary" : "text-foreground"
      )}>
        {formatTime(timeLeft)}
      </span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            isCritical ? "bg-destructive" : isLow ? "bg-primary" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

