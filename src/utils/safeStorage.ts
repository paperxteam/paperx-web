/**
 * Safe, fault-tolerant Storage utility with memory fallback
 * Guarantees zero runtime crashes in partitioned/sandboxed iframes, private browsing,
 * or when localStorage access is restricted.
 */

const memoryStore = new Map<string, string>();

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          memoryStore.set(key, val);
          return val;
        }
      }
    } catch (_) {
      // Storage access blocked or restricted in iframe
    }
    return memoryStore.has(key) ? (memoryStore.get(key) ?? null) : null;
  },

  setItem: (key: string, value: string): void => {
    memoryStore.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (_) {
      // Storage access blocked or restricted in iframe
    }
  },

  removeItem: (key: string): void => {
    memoryStore.delete(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (_) {
      // Storage access blocked or restricted in iframe
    }
  }
};
