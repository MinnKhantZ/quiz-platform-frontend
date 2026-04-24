import { create } from "zustand";
import { getSocket, connectSocket, disconnectSocket } from "../lib/socket";
import { cache } from "../lib/cache";
import type { LiveSession, LiveParticipant, SessionSnapshot, Question, LiveResult } from "../types";

// ── Resume hint (localStorage — survives new tabs, cleared on session end) ──
const RESUME_HINT_KEY = "liveSessionHint";
const RESUME_HINT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours max

interface ResumeHint {
  sessionId: string;
  role: "TEACHER" | "STUDENT";
  expiresAt: number;
}

export function saveResumeHint(hint: Omit<ResumeHint, "expiresAt">): void {
  try {
    const stored: ResumeHint = { ...hint, expiresAt: Date.now() + RESUME_HINT_TTL_MS };
    localStorage.setItem(RESUME_HINT_KEY, JSON.stringify(stored));
  } catch {
    /* ignore */
  }
}

export function getResumeHint(): Omit<ResumeHint, "expiresAt"> | null {
  try {
    const raw = localStorage.getItem(RESUME_HINT_KEY);
    if (!raw) return null;
    const hint = JSON.parse(raw) as ResumeHint;
    if (Date.now() > hint.expiresAt) {
      localStorage.removeItem(RESUME_HINT_KEY);
      return null;
    }
    return { sessionId: hint.sessionId, role: hint.role };
  } catch {
    return null;
  }
}

export function clearResumeHint(): void {
  try {
    localStorage.removeItem(RESUME_HINT_KEY);
  } catch {
    /* ignore */
  }
}

// ── Local answer tracking (teacher real-time view) ─────────────────────────
interface LiveAnswerEntry {
  studentId: string;
  questionId: string;
  selectedOption?: number;
  isCorrect: boolean;
}

interface SessionState {
  showResults: boolean;
  showLeaderboard: boolean;
}

// ── Store interface ────────────────────────────────────────────────────────
interface SocketState {
  connected: boolean;
  reconnecting: boolean;
  resuming: boolean;
  teacherOnline: boolean;
  session: LiveSession | null;
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  students: LiveParticipant[];
  answers: LiveAnswerEntry[];
  sessionFinished: boolean;
  sessionResults: LiveResult[];
  sessionState: SessionState;

  connect: () => void;
  createSession: (quizId: string) => Promise<{ success: boolean; error?: string }>;
  joinSession: (joinCode: string) => Promise<{ success: boolean; error?: string }>;
  resumeSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  tryResume: () => Promise<{ success: boolean; error?: string }>;
  startSession: () => Promise<{ success: boolean; error?: string }>;
  nextQuestion: () => Promise<{ success: boolean; finished?: boolean; results?: LiveResult[]; error?: string }>;
  submitLiveAnswer: (
    questionId: string,
    selectedOption: number | null,
    textAnswer: string | null
  ) => Promise<{ success: boolean; isCorrect?: boolean; error?: string }>;
  setSessionState: (showResults: boolean, showLeaderboard: boolean) => Promise<{ success: boolean; error?: string }>;
  endSession: () => Promise<{ success: boolean; error?: string }>;
  leaveSession: () => void;
  disconnect: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  resuming: false,
  teacherOnline: true,
  sessionFinished: false,
  sessionResults: [] as LiveResult[],
  sessionState: { showResults: false, showLeaderboard: false } as SessionState,
};

// ── Snapshot hydration (pure, no side effects) ─────────────────────────────
function hydrateFromSnapshot(
  snapshot: SessionSnapshot,
  set: (partial: Partial<SocketState>) => void
): void {
  set({
    session: snapshot.session,
    currentQuestion: snapshot.currentQuestion,
    questionIndex: snapshot.questionIndex,
    totalQuestions: snapshot.totalQuestions,
    students: snapshot.participants,
    answers: snapshot.answers,
    sessionFinished: snapshot.sessionFinished,
    sessionResults: snapshot.sessionResults,
    teacherOnline: snapshot.teacherOnline,
    sessionState: {
      showResults: snapshot.session.showResults,
      showLeaderboard: snapshot.session.showLeaderboard,
    },
    resuming: false,
  });
}

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

    // Remove stale listeners before (re-)registering
    socket.off("connect");
    socket.off("disconnect");
    socket.off("connect_error");
    socket.off("participant-update");
    socket.off("teacher-status");
    socket.off("question");
    socket.off("answer-received");
    socket.off("session-finished");
    socket.off("session-state");
    socket.off("session-terminated");

    socket.on("connect", () => {
      const wasReconnecting = get().reconnecting;
      set({ connected: true, reconnecting: false });

      // Auto-resume on transient reconnect (socket auto-reconnected while page was still open)
      if (wasReconnecting) {
        const { session } = get();
        if (session?.id) {
          void get().resumeSession(session.id);
        }
      }
    });

    socket.on("disconnect", () => set({ connected: false, reconnecting: true }));
    socket.on("connect_error", () => set({ connected: false, reconnecting: true }));

    // Student joined or presence changed (online/offline)
    socket.on("participant-update", ({ studentId, name, online }: LiveParticipant) => {
      set((state) => {
        const existing = state.students.find((s) => s.studentId === studentId);
        if (existing) {
          return { students: state.students.map((s) => (s.studentId === studentId ? { ...s, online } : s)) };
        }
        return { students: [...state.students, { studentId, name, online }] };
      });
    });

    // Teacher came back online or went away
    socket.on("teacher-status", ({ online }: { online: boolean }) => {
      set({ teacherOnline: online });
    });

    socket.on("question", ({ index, total, question }: { index: number; total: number; question: Question }) => {
      set({ currentQuestion: question, questionIndex: index, totalQuestions: total, answers: [], teacherOnline: true });
    });

    socket.on("answer-received", (answer: LiveAnswerEntry) => {
      set((state) => ({ answers: [...state.answers, answer] }));
    });

    // Quiz questions exhausted — students wait for teacher action
    socket.on("session-finished", ({ results }: { results: LiveResult[] }) => {
      set({ sessionFinished: true, sessionResults: results, currentQuestion: null });
      cache.invalidate("student:dashboard");
      cache.invalidatePrefix("history:");
      const quizId = get().session?.quizId;
      if (quizId) {
        cache.invalidate(`leaderboard:${quizId}`);
        cache.invalidate(`analytics:${quizId}`);
      }
    });

    socket.on("session-state", ({ showResults, showLeaderboard }: SessionState) => {
      set({ sessionState: { showResults, showLeaderboard } });
    });

    // Teacher terminated the session (explicit or timeout)
    socket.on("session-terminated", () => {
      clearResumeHint();
      // Reset session state but keep socket connected — teacher/student can
      // immediately start or join a new session without reconnecting.
      set({
        session: null,
        currentQuestion: null,
        students: [],
        answers: [],
        questionIndex: 0,
        totalQuestions: 0,
        ...INITIAL_STATE,
      });
    });
  },

  createSession: (quizId: string) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      if (!socket.connected) {
        resolve({ success: false, error: "Socket not connected" });
        return;
      }
      socket.emit(
        "create-session",
        { quizId },
        (res: { success: boolean; snapshot?: SessionSnapshot; error?: string; sessionId?: string }) => {
          if (res.success && res.snapshot) {
            hydrateFromSnapshot(res.snapshot, set);
            saveResumeHint({ sessionId: res.snapshot.session.id, role: "TEACHER" });
            resolve({ success: true });
          } else if (res.error === "active_session_exists" && res.sessionId) {
            // Auto-resume the stale session rather than silently failing
            get().resumeSession(res.sessionId).then((result) => {
              if (result.success) {
                saveResumeHint({ sessionId: res.sessionId!, role: "TEACHER" });
              }
              resolve(result);
            });
          } else {
            resolve({ success: res.success, error: res.error });
          }
        }
      );
    });
  },

  joinSession: (joinCode: string) => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit(
        "join-session",
        { joinCode },
        (res: { success: boolean; snapshot?: SessionSnapshot; error?: string }) => {
          if (res.success && res.snapshot) {
            hydrateFromSnapshot(res.snapshot, set);
            saveResumeHint({ sessionId: res.snapshot.session.id, role: "STUDENT" });
          }
          resolve({ success: res.success, error: res.error });
        }
      );
    });
  },

  resumeSession: (sessionId: string) => {
    set({ resuming: true });
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit(
        "resume-session",
        { sessionId },
        (res: { success: boolean; snapshot?: SessionSnapshot; error?: string }) => {
          if (res.success && res.snapshot) {
            hydrateFromSnapshot(res.snapshot, set);
          } else {
            // Clear stale hint so next page load doesn't keep retrying
            clearResumeHint();
            set({ resuming: false });
          }
          resolve({ success: res.success, error: res.error });
        }
      );
    });
  },

  tryResume: () => {
    const hint = getResumeHint();
    if (!hint) return Promise.resolve({ success: false, error: "no_hint" });
    return get().resumeSession(hint.sessionId);
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
            set({ currentQuestion: null, sessionResults: res.results ?? [] });
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
    // Update local state immediately so the teacher's own checkboxes reflect the change
    // (backend uses socket.to which excludes the sender, so no event comes back to teacher)
    set({ sessionState: { showResults, showLeaderboard } });
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("set-session-state", { showResults, showLeaderboard }, resolve);
    });
  },

  endSession: () => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("end-session", (res: { success: boolean; error?: string }) => {
        if (res.success) clearResumeHint();
        resolve(res);
      });
    });
  },

  // Signal leave intent then close transport — does NOT reset session state
  leaveSession: () => {
    const { session, connected } = get();
    if (session && connected) {
      try {
        getSocket().emit("leave-session");
      } catch {
        /* ignore if socket already closing */
      }
    }
    disconnectSocket();
    set({ connected: false, reconnecting: false });
  },

  // Close transport only (no state reset, no signal — used internally)
  disconnect: () => {
    disconnectSocket();
    set({ connected: false, reconnecting: false });
  },

  reset: () => {
    clearResumeHint();
    disconnectSocket();
    set({
      connected: false,
      reconnecting: false,
      session: null,
      currentQuestion: null,
      questionIndex: 0,
      totalQuestions: 0,
      students: [],
      answers: [],
      ...INITIAL_STATE,
    });
  },
}));
