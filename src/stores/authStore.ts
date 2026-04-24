import { create } from "zustand";
import { api } from "../lib/api";
import { cache } from "../lib/cache";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  loading: true,

  initialize: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const user = await api.get<User>("/auth/me");
      set({ user, token, loading: false });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null, loading: false });
    }
  },

  login: async (email: string, password: string) => {
    const { user, token } = await api.post<{ user: User; token: string }>("/auth/login", { email, password });
    localStorage.setItem("token", token);
    set({ user, token });
  },

  register: async (email: string, password: string, name: string, role: string) => {
    const { user, token } = await api.post<{ user: User; token: string }>("/auth/register", { email, password, name, role });
    localStorage.setItem("token", token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("token");
    cache.clear();
    set({ user: null, token: null });
  },
}));
