import { create } from "zustand";
import { api } from "../lib/api";
import { cache } from "../lib/cache";
import type { Quiz, Question } from "../types";

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  loading: boolean;
  error: string | null;
  fetchQuizzes: () => Promise<void>;
  fetchQuiz: (id: string) => Promise<void>;
  createQuiz: (data: Partial<Quiz>) => Promise<Quiz>;
  updateQuiz: (id: string, data: Partial<Quiz>) => Promise<Quiz>;
  deleteQuiz: (id: string) => Promise<void>;
  addQuestion: (quizId: string, data: Partial<Question>) => Promise<Question>;
  updateQuestion: (id: string, data: Partial<Question>) => Promise<Question>;
  deleteQuestion: (id: string) => Promise<void>;
  clearCurrent: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  quizzes: [],
  currentQuiz: null,
  loading: false,
  error: null,

  fetchQuizzes: async () => {
    const stale = cache.get<Quiz[]>("quizzes:list");
    if (stale) {
      set({ quizzes: stale, loading: false });
    } else {
      set({ loading: true, error: null });
    }
    const unsub = cache.subscribe<Quiz[]>("quizzes:list", (fresh) => {
      set({ quizzes: fresh });
      unsub();
    });
    try {
      const quizzes = await cache.fetch<Quiz[]>("quizzes:list", () => api.get<Quiz[]>("/quizzes"));
      set({ quizzes, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      unsub();
    }
  },

  fetchQuiz: async (id: string) => {
    const stale = cache.get<Quiz>(`quiz:${id}`);
    if (stale) {
      set({ currentQuiz: stale, loading: false });
    } else {
      set({ loading: true, error: null });
    }
    const unsub = cache.subscribe<Quiz>(`quiz:${id}`, (fresh) => {
      set({ currentQuiz: fresh });
      unsub();
    });
    try {
      const quiz = await cache.fetch<Quiz>(`quiz:${id}`, () => api.get<Quiz>(`/quizzes/${id}`));
      set({ currentQuiz: quiz, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      unsub();
    }
  },

  createQuiz: async (data: Partial<Quiz>) => {
    const quiz = await api.post<Quiz>("/quizzes", data as Record<string, unknown>);
    set((state) => ({ quizzes: [quiz, ...state.quizzes] }));
    cache.invalidate("teacher:dashboard");
    cache.invalidate("quizzes:list");
    cache.invalidatePrefix("quizzes:student:");
    return quiz;
  },

  updateQuiz: async (id: string, data: Partial<Quiz>) => {
    const quiz = await api.put<Quiz>(`/quizzes/${id}`, data as Record<string, unknown>);
    set((state) => ({
      quizzes: state.quizzes.map((q) => (q.id === id ? quiz : q)),
      currentQuiz: quiz,
    }));
    cache.invalidate("teacher:dashboard");
    cache.invalidate("quizzes:list");
    cache.invalidate(`quiz:${id}`);
    cache.invalidatePrefix("quizzes:student:");
    return quiz;
  },

  deleteQuiz: async (id: string) => {
    await api.delete(`/quizzes/${id}`);
    set((state) => ({
      quizzes: state.quizzes.filter((q) => q.id !== id),
    }));
    cache.invalidate("teacher:dashboard");
    cache.invalidate("quizzes:list");
    cache.invalidate(`quiz:${id}`);
    cache.invalidatePrefix("quizzes:student:");
    cache.invalidate(`leaderboard:${id}`);
    cache.invalidate(`analytics:${id}`);
  },

  addQuestion: async (quizId: string, data: Partial<Question>) => {
    return api.post<Question>(`/${quizId}/questions`, data as Record<string, unknown>);
  },

  updateQuestion: async (id: string, data: Partial<Question>) => {
    return api.put<Question>(`/questions/${id}`, data as Record<string, unknown>);
  },

  deleteQuestion: async (id: string) => {
    await api.delete(`/questions/${id}`);
  },

  clearCurrent: () => set({ currentQuiz: null }),
}));
