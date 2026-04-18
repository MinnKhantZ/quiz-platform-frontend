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
        "flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left text-sm transition-all",
        selected && !correct && !wrong && "border-primary bg-primary/10",
        correct && "border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200",
        wrong && "border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
        !selected && !correct && !wrong && "border-border hover:border-primary/50 hover:bg-accent",
        disabled && !correct && !wrong && "opacity-60 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold",
          selected && !correct && !wrong && "bg-primary text-primary-foreground",
          correct && "bg-green-500 text-white",
          wrong && "bg-red-500 text-white",
          !selected && !correct && !wrong && "bg-muted"
        )}
      >
        {letters[index] || index + 1}
      </span>
      <span className="flex-1">{text}</span>
    </button>
  );
}
