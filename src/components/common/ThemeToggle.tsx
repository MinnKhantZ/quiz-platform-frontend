import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeStore, type Theme } from "../../stores/themeStore";
import { cn } from "../../lib/utils";

const options: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark", icon: Moon, label: "Dark" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div
      className="flex items-center rounded-lg border border-border bg-muted p-0.5 gap-0.5"
      role="group"
      aria-label="Color theme"
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          aria-pressed={theme === value}
          className={cn(
            "flex items-center justify-center h-7 w-7 rounded-md transition-all duration-150 cursor-pointer",
            theme === value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
