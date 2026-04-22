import { cn } from "../../lib/utils";

interface OptionButtonProps {
  text: string;
  index: number;
  selected: boolean;
  correct: boolean;
  wrong: boolean;
  disabled: boolean;
  onClick: (index: number) => void;
}

export default function OptionButton({ text, index, selected, correct, wrong, disabled, onClick }: OptionButtonProps) {
  const letters = ["A", "B", "C", "D"];

  return (
    <button
      onClick={() => !disabled && onClick(index)}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-xl border-2 p-3.5 text-left text-sm transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        correct && "border-success/60 bg-success/10 text-success",
        wrong && "border-destructive/60 bg-destructive/10 text-destructive",
        selected && !correct && !wrong && "border-primary/60 bg-primary/10 text-primary",
        !selected && !correct && !wrong && "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/60",
        disabled && !correct && !wrong && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-display font-bold",
          correct && "bg-success text-white",
          wrong && "bg-destructive text-white",
          selected && !correct && !wrong && "bg-primary text-primary-foreground",
          !selected && !correct && !wrong && "bg-secondary text-muted-foreground"
        )}
      >
        {letters[index] ?? index + 1}
      </span>
      <span className="flex-1 font-medium">{text}</span>
    </button>
  );
}

