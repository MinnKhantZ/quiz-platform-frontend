import { create } from "zustand";
import { getSocket, connectSocket, disconnectSocket } from "../lib/socket.js";

export const useSocketStore = create((set, get) => ({
  connected: false,
  session: null,
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  students: [],
  answers: [],

  connect: () => {
    const socket = connectSocket();

    socket.on("connect", () => set({ connected: true }));
    socket.on("disconnect", () => set({ connected: false }));

    socket.on("student-joined", ({ student }) => {
      set((state) => ({ students: [...state.students, student] }));
    });

    socket.on("question", ({ index, total, question }) => {
      set({ currentQuestion: question, questionIndex: index, totalQuestions: total, answers: [] });
    });

    socket.on("answer-received", (answer) => {
      set((state) => ({ answers: [...state.answers, answer] }));
    });

    socket.on("session-ended", () => {
      set({ session: null, currentQuestion: null });
    });
  },

  createSession: (quizId) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("create-session", { quizId }, (res) => {
        if (res.success) set({ session: res.session, students: [], answers: [] });
        resolve(res);
      });
    });
  },

  joinSession: (joinCode) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("join-session", { joinCode }, (res) => {
        if (res.success) set({ session: res.session });
        resolve(res);
      });
    });
  },

  startSession: () => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("start-session", resolve);
    });
  },

  nextQuestion: () => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("next-question", resolve);
    });
  },

  submitLiveAnswer: (questionId, selectedOption, textAnswer) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("live-answer", { questionId, selectedOption, textAnswer }, resolve);
    });
  },

  endSession: () => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("end-session", resolve);
    });
  },

  disconnect: () => {
    disconnectSocket();
    set({ connected: false, session: null, currentQuestion: null, students: [], answers: [] });
  },

  reset: () =>
    set({ session: null, currentQuestion: null, questionIndex: 0, totalQuestions: 0, students: [], answers: [] }),
}));
