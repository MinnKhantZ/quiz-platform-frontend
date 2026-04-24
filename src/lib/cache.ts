/**
 * Minimal stale-while-revalidate cache.
 *
 * Usage:
 *   // Read (undefined if never fetched)
 *   const cached = cache.get<T>("key");
 *
 *   // Fetch with SWR: resolves immediately with stale data if available,
 *   // always kicks off a background revalidation, subscribers get notified.
 *   const data = await cache.fetch("key", () => api.get("/endpoint"));
 *
 *   // Subscribe to updates (returns unsubscribe fn)
 *   const unsub = cache.subscribe("key", (data) => setState(data));
 *
 *   // Invalidate after mutation so the next fetch hits the network
 *   cache.invalidate("key");
 *   cache.invalidatePrefix("/quizzes");  // e.g. clears "/quizzes" + "/quizzes/123"
 */

type Entry<T> = { data: T; fetchedAt: number };
type Subscriber<T> = (data: T) => void;

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subscribers = new Map<string, Set<Subscriber<any>>>();

function notify<T>(key: string, data: T) {
  subscribers.get(key)?.forEach((cb) => cb(data));
}

export const cache = {
  get<T>(key: string): T | undefined {
    return (store.get(key) as Entry<T> | undefined)?.data;
  },

  /** Returns stale data immediately (if cached) and revalidates in background. */
  async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = store.get(key) as Entry<T> | undefined;

    // Deduplicate concurrent fetches for the same key
    const doFetch = (): Promise<T> => {
      if (inflight.has(key)) return inflight.get(key) as Promise<T>;
      const p = fetcher().then((data) => {
        store.set(key, { data, fetchedAt: Date.now() });
        inflight.delete(key);
        notify(key, data);
        return data;
      }).catch((err) => {
        inflight.delete(key);
        throw err;
      });
      inflight.set(key, p);
      return p;
    };

    if (existing) {
      // Serve stale immediately, revalidate in background
      doFetch().catch(() => {});
      return existing.data;
    }

    return doFetch();
  },

  /** Subscribe to updates for a key. Returns an unsubscribe function. */
  subscribe<T>(key: string, cb: Subscriber<T>): () => void {
    if (!subscribers.has(key)) subscribers.set(key, new Set());
    subscribers.get(key)!.add(cb as Subscriber<unknown>);
    return () => subscribers.get(key)?.delete(cb as Subscriber<unknown>);
  },

  invalidate(key: string) {
    store.delete(key);
  },

  invalidatePrefix(prefix: string) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },

  /** Clear all cached entries and in-flight requests. Call on logout. */
  clear() {
    store.clear();
    inflight.clear();
  },
};
