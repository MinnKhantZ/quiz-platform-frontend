import { create } from "zustand";

export type Theme = "dark" | "light" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  if (theme !== "system") {
    root.classList.add(theme);
  }
}

const storedTheme = (localStorage.getItem("theme") as Theme) ?? "dark";
applyTheme(storedTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: storedTheme,
  setTheme: (theme: Theme) => {
    localStorage.setItem("theme", theme);
    applyTheme(theme);
    set({ theme });
  },
}));
