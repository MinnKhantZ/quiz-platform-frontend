import { create } from "zustand";
import { api } from "../lib/api";
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
    set({ loading: true, error: null });
    try {
      const quizzes = await api.get<Quiz[]>("/quizzes");
      set({ quizzes, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchQuiz: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const quiz = await api.get<Quiz>(`/quizzes/${id}`);
      set({ currentQuiz: quiz, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createQuiz: async (data: Partial<Quiz>) => {
    const quiz = await api.post<Quiz>("/quizzes", data as Record<string, unknown>);
    set((state) => ({ quizzes: [quiz, ...state.quizzes] }));
    return quiz;
  },

  updateQuiz: async (id: string, data: Partial<Quiz>) => {
    const quiz = await api.put<Quiz>(`/quizzes/${id}`, data as Record<string, unknown>);
    set((state) => ({
      quizzes: state.quizzes.map((q) => (q.id === id ? quiz : q)),
      currentQuiz: quiz,
    }));
    return quiz;
  },

  deleteQuiz: async (id: string) => {
    await api.delete(`/quizzes/${id}`);
    set((state) => ({
      quizzes: state.quizzes.filter((q) => q.id !== id),
    }));
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
