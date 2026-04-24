import { useState, useEffect } from "react";

export type ToastVariant = "default" | "success" | "error";

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type Listener = (toasts: ToastItem[]) => void;

let nextId = 1;
let store: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  const snapshot = [...store];
  listeners.forEach((l) => l(snapshot));
}

export const toast = {
  show(config: Omit<ToastItem, "id">) {
    const id = nextId++;
    store = [...store, { ...config, id }];
    emit();
    const duration = config.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        store = store.filter((t) => t.id !== id);
        emit();
      }, duration);
    }
    return id;
  },

  success(title: string, description?: string) {
    return this.show({ title, description, variant: "success" });
  },

  error(title: string, description?: string) {
    return this.show({ title, description, variant: "error" });
  },

  dismiss(id: number) {
    store = store.filter((t) => t.id !== id);
    emit();
  },
};

export function useToastStore(): ToastItem[] {
  const [state, setState] = useState<ToastItem[]>([...store]);
  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return state;
}
