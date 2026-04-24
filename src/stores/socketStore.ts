import { create } from "zustand";
import { getSocket, connectSocket, disconnectSocket } from "../lib/socket";
import { cache } from "../lib/cache";
import type { LiveSession, Question, User, LiveResult } from "../types";

interface LiveAnswer {
  studentId: string;
  questionId: string;
  isCorrect: boolean;
}

interface SessionState {
  showResults: boolean;
  showLeaderboard: boolean;
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
  sessionFinished: boolean;
  sessionResults: LiveResult[];
  sessionState: SessionState;
  connect: () => void;
  createSession: (quizId: string) => Promise<{ success: boolean; session?: LiveSession; error?: string }>;
  joinSession: (joinCode: string) => Promise<{ success: boolean; session?: LiveSession; error?: string }>;
  startSession: () => Promise<{ success: boolean; error?: string }>;
  nextQuestion: () => Promise<{ success: boolean; finished?: boolean; results?: LiveResult[]; error?: string }>;
  submitLiveAnswer: (
    questionId: string,
    selectedOption: number | null,
    textAnswer: string | null
  ) => Promise<{ success: boolean; isCorrect?: boolean; error?: string }>;
  setSessionState: (showResults: boolean, showLeaderboard: boolean) => Promise<{ success: boolean; error?: string }>;
  endSession: () => Promise<{ success: boolean; error?: string }>;
  disconnect: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  sessionFinished: false,
  sessionResults: [] as LiveResult[],
  sessionState: { showResults: false, showLeaderboard: false } as SessionState,
};

export const useSocketStore = create<SocketState>((set, get) => ({
  connected: false,
  reconnecting: false,
  session: null,
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  students: [],
  answers: [],
  ...INITIAL_STATE,

  connect: () => {
    const socket = connectSocket();

    socket.off("connect");
    socket.off("disconnect");
    socket.off("connect_error");
    socket.off("student-joined");
    socket.off("question");
    socket.off("answer-received");
    socket.off("session-finished");
    socket.off("session-state");
    socket.off("session-terminated");

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

    // Quiz questions exhausted — students wait for teacher action
    socket.on("session-finished", ({ results }: { results: LiveResult[] }) => {
      set({ sessionFinished: true, sessionResults: results, currentQuestion: null });
      // Attempts have been created server-side; invalidate so affected views re-fetch
      cache.invalidate("student:dashboard");
      cache.invalidatePrefix("history:");
      const quizId = get().session?.quizId;
      if (quizId) {
        cache.invalidate(`leaderboard:${quizId}`);
        cache.invalidate(`analytics:${quizId}`);
      }
    });

    // Teacher toggled results/leaderboard visibility
    socket.on("session-state", ({ showResults, showLeaderboard }: SessionState) => {
      set({ sessionState: { showResults, showLeaderboard } });
    });

    // Teacher terminated the session
    socket.on("session-terminated", () => {
      set({
        session: null,
        currentQuestion: null,
        ...INITIAL_STATE,
      });
    });
  },

  createSession: (quizId: string) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("create-session", { quizId }, (res: { success: boolean; session?: LiveSession; error?: string }) => {
        if (res.success && res.session) {
          set({ session: res.session, students: [], answers: [], ...INITIAL_STATE });
        }
        resolve(res);
      });
    });
  },

  joinSession: (joinCode: string) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("join-session", { joinCode }, (res: { success: boolean; session?: LiveSession; error?: string }) => {
        if (res.success && res.session) set({ session: res.session, ...INITIAL_STATE });
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
      socket.emit(
        "next-question",
        (res: { success: boolean; finished?: boolean; results?: LiveResult[]; error?: string }) => {
          if (res.success && res.finished) {
            set({ currentQuestion: null, sessionResults: res.results || [] });
          }
          resolve(res);
        }
      );
    });
  },

  submitLiveAnswer: (questionId: string, selectedOption: number | null, textAnswer: string | null) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("live-answer", { questionId, selectedOption, textAnswer }, resolve);
    });
  },

  setSessionState: (showResults: boolean, showLeaderboard: boolean) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("set-session-state", { showResults, showLeaderboard }, resolve);
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
    set({ connected: false, reconnecting: false, session: null, currentQuestion: null, students: [], answers: [], ...INITIAL_STATE });
  },

  reset: () =>
    set({ session: null, currentQuestion: null, questionIndex: 0, totalQuestions: 0, students: [], answers: [], ...INITIAL_STATE }),
}));
