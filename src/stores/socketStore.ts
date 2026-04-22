import { create } from "zustand";
import { getSocket, connectSocket, disconnectSocket } from "../lib/socket";
import type { LiveSession, Question, User } from "../types";

interface LiveAnswer {
  studentId: string;
  questionId: string;
  isCorrect: boolean;
}

interface SocketState {
  connected: boolean;
  reconnecting: boolean;
  session: LiveSession | null;
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  students: User[];
  answers: LiveAnswer[];
  connect: () => void;
  createSession: (quizId: string) => Promise<{ success: boolean; session?: LiveSession; error?: string }>;
  joinSession: (joinCode: string) => Promise<{ success: boolean; session?: LiveSession; error?: string }>;
  startSession: () => Promise<{ success: boolean; error?: string }>;
  nextQuestion: () => Promise<{ success: boolean; finished?: boolean; error?: string }>;
  submitLiveAnswer: (
    questionId: string,
    selectedOption: number | null,
    textAnswer: string | null
  ) => Promise<{ success: boolean; isCorrect?: boolean; error?: string }>;
  endSession: () => Promise<{ success: boolean; error?: string }>;
  disconnect: () => void;
  reset: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  connected: false,
  reconnecting: false,
  session: null,
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  students: [],
  answers: [],

  connect: () => {
    const socket = connectSocket();

    socket.off("connect");
    socket.off("disconnect");
    socket.off("connect_error");
    socket.off("student-joined");
    socket.off("question");
    socket.off("answer-received");
    socket.off("session-ended");

    socket.on("connect", () => set({ connected: true, reconnecting: false }));
    socket.on("disconnect", () => set({ connected: false, reconnecting: true }));
    socket.on("connect_error", () => set({ connected: false, reconnecting: true }));

    socket.on("student-joined", ({ student }: { student: User }) => {
      set((state) => ({ students: [...state.students, student] }));
    });

    socket.on("question", ({ index, total, question }: { index: number; total: number; question: Question }) => {
      set({ currentQuestion: question, questionIndex: index, totalQuestions: total, answers: [] });
    });

    socket.on("answer-received", (answer: LiveAnswer) => {
      set((state) => ({ answers: [...state.answers, answer] }));
    });

    socket.on("session-ended", () => {
      set({ session: null, currentQuestion: null });
    });
  },

  createSession: (quizId: string) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("create-session", { quizId }, (res: { success: boolean; session?: LiveSession; error?: string }) => {
        if (res.success && res.session) set({ session: res.session, students: [], answers: [] });
        resolve(res);
      });
    });
  },

  joinSession: (joinCode: string) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("join-session", { joinCode }, (res: { success: boolean; session?: LiveSession; error?: string }) => {
        if (res.success && res.session) set({ session: res.session });
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

  submitLiveAnswer: (questionId: string, selectedOption: number | null, textAnswer: string | null) => {
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
    set({ connected: false, reconnecting: false, session: null, currentQuestion: null, students: [], answers: [] });
  },

  reset: () =>
    set({ session: null, currentQuestion: null, questionIndex: 0, totalQuestions: 0, students: [], answers: [] }),
}));
