// tempStore.ts
type ChangeType = "set" | "remove" | "clear" | "expire";
export type TempStoreEvent<T = unknown> = {
  type: ChangeType;
  key?: string;
  value?: T;
};

type Entry<T> = { value: T; expiresAt?: number };

class TempStore {
  private store = new Map<string, Entry<any>>();
  private target = new EventTarget();

  /** Set a value. Optionally pass ttlMs for auto-expire */
  set<T>(key: string, value: T, ttlMs?: number) {
    const expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
    this.store.set(key, { value, expiresAt });
    this.dispatch<T>("set", key, value);
  }

  /** Get a value; removes it if expired */
  get<T>(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (e.expiresAt && e.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.dispatch<T>("expire", key, e.value);
      return undefined;
    }
    return e.value as T;
  }

  has(key: string) {
    return this.get(key) !== undefined;
  }

  /** Remove a value */
  remove<T>(key: string) {
    const e = this.store.get(key);
    if (e) {
      this.store.delete(key);
      this.dispatch<T>("remove", key, e.value);
    }
  }

  /** Clear all values */
  clear() {
    this.store.clear();
    this.dispatch("clear");
  }

  /** Subscribe to all changes. Returns unsubscribe fn */
  subscribe<T = unknown>(listener: (e: TempStoreEvent<T>) => void) {
    const handler = (ev: Event) => listener((ev as CustomEvent).detail);
    this.target.addEventListener("change", handler);
    return () => this.target.removeEventListener("change", handler);
  }

  /** Optional: helpful for debugging */
  keys() {
    return Array.from(this.store.keys());
  }

  private dispatch<T>(type: ChangeType, key?: string, value?: T) {
    this.target.dispatchEvent(
      new CustomEvent("change", {
        detail: { type, key, value } as TempStoreEvent<T>,
      })
    );
  }
}

export const tempStore = new TempStore();
