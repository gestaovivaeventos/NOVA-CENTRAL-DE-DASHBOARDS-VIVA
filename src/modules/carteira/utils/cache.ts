/**
 * Cache simples no cliente para o módulo Carteira
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ClientCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  get<T>(key: string, ttl: number = 5 * 60 * 1000): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const clientCache = new ClientCache();

export const CACHE_KEYS = {
  CARTEIRA_DATA: 'carteira:data',
  CARTEIRA_PROCESSED: 'carteira:processed',
};

export const CACHE_TTL = {
  SHORT: 60 * 1000, // 1 minuto
  MEDIUM: 5 * 60 * 1000, // 5 minutos
  LONG: 15 * 60 * 1000, // 15 minutos
};
