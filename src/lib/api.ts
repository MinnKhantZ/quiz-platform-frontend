const API_BASE = `${import.meta.env.VITE_API_URL ?? ""}/api`;
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10000);

let unauthorizedHandler: (() => void) | null = null;

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

interface RequestOptions extends RequestInit {
  body?: BodyInit | Record<string, unknown> | null;
}

async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers,
      body:
        options.body instanceof FormData
          ? options.body
          : options.body
            ? JSON.stringify(options.body)
            : undefined,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const error = new ApiError(data.error || `Request failed (${res.status})`, res.status);

      if (res.status === 401 && token && !path.startsWith("/auth/login") && !path.startsWith("/auth/register")) {
        unauthorizedHandler?.();
      }

      throw error;
    }

    if (res.status === 204) {
      return undefined as T;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return undefined as T;
    }

    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body?: Record<string, unknown>) => request<T>(path, { method: "POST", body }),
  put: <T = unknown>(path: string, body?: Record<string, unknown>) => request<T>(path, { method: "PUT", body }),
  patch: <T = unknown>(path: string, body?: Record<string, unknown>) => request<T>(path, { method: "PATCH", body }),
  delete: <T = unknown>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T = unknown>(path: string, formData: FormData) => request<T>(path, { method: "POST", body: formData }),
};
