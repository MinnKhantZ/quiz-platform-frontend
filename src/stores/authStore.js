import { create } from "zustand";
import { api } from "../lib/api.js";

export const useAuthStore = create((set, get) => ({
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
      const user = await api.get("/auth/me");
      set({ user, token, loading: false });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null, loading: false });
    }
  },

  login: async (email, password) => {
    const { user, token } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", token);
    set({ user, token });
  },

  register: async (email, password, name, role) => {
    const { user, token } = await api.post("/auth/register", { email, password, name, role });
    localStorage.setItem("token", token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
}));
