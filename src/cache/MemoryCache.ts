export class MemoryCache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();
  private ttl: number;

  constructor(ttlSeconds: number) {
    this.ttl = ttlSeconds * 1000;
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  clear(): void {
    this.cache.clear();
  }
}
