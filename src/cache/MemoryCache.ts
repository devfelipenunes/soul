export class MemoryCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();
  private ttlSeconds: number;

  constructor(ttlSeconds: number = 60) {
    this.ttlSeconds = ttlSeconds;
  }

  set(key: string, value: T) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}
