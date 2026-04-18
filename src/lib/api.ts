const API_BASE = `${import.meta.env.VITE_API_URL ?? ""}/api`;

interface RequestOptions extends RequestInit {
  body?: BodyInit | Record<string, unknown> | null;
}

interface ApiError extends Error {
  status?: number;
}

async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
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
    const error: ApiError = new Error(data.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body?: Record<string, unknown>) => request<T>(path, { method: "POST", body }),
  put: <T = unknown>(path: string, body?: Record<string, unknown>) => request<T>(path, { method: "PUT", body }),
  patch: <T = unknown>(path: string, body?: Record<string, unknown>) => request<T>(path, { method: "PATCH", body }),
  delete: <T = unknown>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T = unknown>(path: string, formData: FormData) => request<T>(path, { method: "POST", body: formData }),
};
