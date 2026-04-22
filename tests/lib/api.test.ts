import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, setUnauthorizedHandler } from "../../src/lib/api";

describe("api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    setUnauthorizedHandler(null);
  });

  it("triggers unauthorized handler on protected 401 responses", async () => {
    localStorage.setItem("token", "token-123");
    const unauthorizedHandler = vi.fn();
    setUnauthorizedHandler(unauthorizedHandler);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      } as Response)
    );

    await expect(api.get("/quizzes")).rejects.toBeInstanceOf(ApiError);
    expect(unauthorizedHandler).toHaveBeenCalledOnce();
  });

  it("maps aborts to timeout ApiError", async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      "fetch",
      vi.fn((_, init) => {
        return new Promise((_resolve, reject) => {
          (init as { signal?: AbortSignal } | undefined)?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      })
    );

    const requestPromise = api.get("/quizzes");
    const assertion = expect(requestPromise).rejects.toMatchObject({
      message: "Request timed out. Please try again.",
    });

    await vi.advanceTimersByTimeAsync(10_100);
    await assertion;

    vi.useRealTimers();
  });
});
