import { create } from "zustand";
import { api } from "../lib/api.js";

export const useQuizStore = create((set) => ({
  quizzes: [],
  currentQuiz: null,
  loading: false,
  error: null,

  fetchQuizzes: async () => {
    set({ loading: true, error: null });
    try {
      const quizzes = await api.get("/quizzes");
      set({ quizzes, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchQuiz: async (id) => {
    set({ loading: true, error: null });
    try {
      const quiz = await api.get(`/quizzes/${id}`);
      set({ currentQuiz: quiz, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createQuiz: async (data) => {
    const quiz = await api.post("/quizzes", data);
    set((state) => ({ quizzes: [quiz, ...state.quizzes] }));
    return quiz;
  },

  updateQuiz: async (id, data) => {
    const quiz = await api.put(`/quizzes/${id}`, data);
    set((state) => ({
      quizzes: state.quizzes.map((q) => (q.id === id ? quiz : q)),
      currentQuiz: quiz,
    }));
    return quiz;
  },

  deleteQuiz: async (id) => {
    await api.delete(`/quizzes/${id}`);
    set((state) => ({
      quizzes: state.quizzes.filter((q) => q.id !== id),
    }));
  },

  addQuestion: async (quizId, data) => {
    return api.post(`/${quizId}/questions`, data);
  },

  updateQuestion: async (id, data) => {
    return api.put(`/questions/${id}`, data);
  },

  deleteQuestion: async (id) => {
    return api.delete(`/questions/${id}`);
  },

  clearCurrent: () => set({ currentQuiz: null }),
}));
