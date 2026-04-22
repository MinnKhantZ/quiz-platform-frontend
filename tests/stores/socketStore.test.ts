import { beforeEach, describe, expect, it, vi } from "vitest";

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

const { useSocketStore } = await import("../../src/stores/socketStore");

describe("socketStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
