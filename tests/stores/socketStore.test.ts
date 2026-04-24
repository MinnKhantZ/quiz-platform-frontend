import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionSnapshot } from "../../src/types";

const fakeSocket = {
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
};

vi.mock("../../src/lib/socket", () => ({
  getSocket: vi.fn(() => fakeSocket),
  connectSocket: vi.fn(() => fakeSocket),
  disconnectSocket: vi.fn(),
}));

const { useSocketStore, saveResumeHint, getResumeHint, clearResumeHint } = await import(
  "../../src/stores/socketStore"
);

// Minimal snapshot factory
const makeSnapshot = (overrides: Partial<SessionSnapshot> = {}): SessionSnapshot => ({
  session: {
    id: "sess1",
    joinCode: "ABC123",
    status: "IN_PROGRESS",
    showResults: false,
    showLeaderboard: false,
    quiz: { id: "q1", title: "Test Quiz", description: "", isPublished: true },
  },
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 3,
  participants: [],
  answers: [],
  sessionFinished: false,
  sessionResults: [],
  teacherOnline: true,
  ...overrides,
});

describe("socketStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useSocketStore.getState().reset();
    useSocketStore.setState({ connected: false, reconnecting: false });
  });

  it("removes old listeners before registering new ones", () => {
    useSocketStore.getState().connect();

    expect(fakeSocket.off).toHaveBeenCalledWith("connect");
    expect(fakeSocket.off).toHaveBeenCalledWith("disconnect");
    expect(fakeSocket.off).toHaveBeenCalledWith("connect_error");
    expect(fakeSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(fakeSocket.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
  });

  it("removes old listeners for new events (participant-update, teacher-status)", () => {
    useSocketStore.getState().connect();

    expect(fakeSocket.off).toHaveBeenCalledWith("participant-update");
    expect(fakeSocket.off).toHaveBeenCalledWith("teacher-status");
    expect(fakeSocket.on).toHaveBeenCalledWith("participant-update", expect.any(Function));
    expect(fakeSocket.on).toHaveBeenCalledWith("teacher-status", expect.any(Function));
  });

  it("sets reconnecting when disconnect event fires", () => {
    useSocketStore.getState().connect();

    const disconnectHandler = fakeSocket.on.mock.calls.find((call) => call[0] === "disconnect")?.[1] as
      | (() => void)
      | undefined;

    expect(disconnectHandler).toBeDefined();
    disconnectHandler?.();

    expect(useSocketStore.getState().connected).toBe(false);
    expect(useSocketStore.getState().reconnecting).toBe(true);
  });

  it("tryResume returns failure when no hint exists", async () => {
    sessionStorage.clear();
    await useSocketStore.getState().tryResume();
    // No emit call expected since there's no hint
    expect(fakeSocket.emit).not.toHaveBeenCalled();
    expect(useSocketStore.getState().resuming).toBe(false);
  });

  it("leaveSession emits leave-session without resetting session state", () => {
    // Hydrate some session state first
    useSocketStore.setState({
      connected: true,
      session: makeSnapshot().session,
    });

    useSocketStore.getState().leaveSession();

    expect(fakeSocket.emit).toHaveBeenCalledWith("leave-session");
    // Session should still be set (not wiped)
    expect(useSocketStore.getState().session).not.toBeNull();
  });

  it("participant-update handler upserts a new student", () => {
    useSocketStore.getState().connect();

    const handler = fakeSocket.on.mock.calls.find((c) => c[0] === "participant-update")?.[1] as
      | ((p: unknown) => void)
      | undefined;

    expect(handler).toBeDefined();

    handler?.({ studentId: "s1", name: "Alice", online: true });
    expect(useSocketStore.getState().students).toHaveLength(1);
    expect(useSocketStore.getState().students[0].name).toBe("Alice");

    // Update existing student (mark offline)
    handler?.({ studentId: "s1", name: "Alice", online: false });
    expect(useSocketStore.getState().students).toHaveLength(1);
    expect(useSocketStore.getState().students[0].online).toBe(false);
  });

  it("teacher-status handler updates teacherOnline", () => {
    useSocketStore.getState().connect();

    const handler = fakeSocket.on.mock.calls.find((c) => c[0] === "teacher-status")?.[1] as
      | ((payload: { online: boolean }) => void)
      | undefined;

    expect(handler).toBeDefined();

    handler?.({ online: false });
    expect(useSocketStore.getState().teacherOnline).toBe(false);

    handler?.({ online: true });
    expect(useSocketStore.getState().teacherOnline).toBe(true);
  });

  it("session-terminated clears resume hint and resets state", () => {
    saveResumeHint({ sessionId: "sess1", role: "STUDENT" });
    useSocketStore.setState({ session: makeSnapshot().session, connected: true });

    useSocketStore.getState().connect();

    const handler = fakeSocket.on.mock.calls.find((c) => c[0] === "session-terminated")?.[1] as
      | (() => void)
      | undefined;

    expect(handler).toBeDefined();
    handler?.();

    expect(getResumeHint()).toBeNull();
    expect(useSocketStore.getState().session).toBeNull();
  });

  it("saveResumeHint and getResumeHint round-trip correctly", () => {
    saveResumeHint({ sessionId: "sess42", role: "TEACHER" });
    const hint = getResumeHint();
    expect(hint).toEqual({ sessionId: "sess42", role: "TEACHER" });
  });

  it("clearResumeHint removes the stored hint", () => {
    saveResumeHint({ sessionId: "sess42", role: "STUDENT" });
    clearResumeHint();
    expect(getResumeHint()).toBeNull();
  });
});
