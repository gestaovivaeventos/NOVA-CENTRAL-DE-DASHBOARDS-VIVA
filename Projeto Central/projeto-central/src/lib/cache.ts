/**
 * Sistema de Cache em Memória para APIs
 * Otimizado para múltiplos usuários simultâneos
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 };
  private pendingRequests: Map<string, Promise<any>> = new Map();
  
  // TTL padrão: 2 minutos (120 segundos)
  private defaultTTL = 120 * 1000;
  
  /**
   * Obtém um item do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size--;
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.data as T;
  }
  
  /**
   * Define um item no cache
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTTL;
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
    
    this.stats.size = this.cache.size;
  }
  
  /**
   * Invalida uma entrada específica do cache
   */
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size--;
    }
    return deleted;
  }
  
  /**
   * Invalida todas as entradas que começam com um prefixo
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0;
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.size = this.cache.size;
    return count;
  }
  
  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }
  
  /**
   * Retorna estatísticas do cache
   */
  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 
      ? ((this.stats.hits / total) * 100).toFixed(2) + '%'
      : '0%';
    
    return {
      ...this.stats,
      hitRate,
    };
  }
  
  /**
   * Request Deduplication - evita múltiplas requisições simultâneas para a mesma chave
   * Se já há uma requisição em andamento para a mesma chave, retorna a mesma Promise
   */
  async getOrFetch<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttlMs?: number
  ): Promise<T> {
    // 1. Verificar cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // 2. Verificar se já há uma requisição pendente
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`[Cache] Deduplicating request for: ${key}`);
      return pending;
    }
    
    // 3. Criar nova requisição
    console.log(`[Cache] Fetching: ${key}`);
    const promise = fetcher()
      .then(data => {
        this.set(key, data, ttlMs);
        return data;
      })
      .finally(() => {
        this.pendingRequests.delete(key);
      });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
  
  /**
   * Limpa entradas expiradas (pode ser chamado periodicamente)
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    this.stats.size = this.cache.size;
    return cleaned;
  }
}

// Singleton - uma única instância compartilhada entre todas as requisições
const globalCache = new MemoryCache();

// Limpar cache expirado a cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = globalCache.cleanup();
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
  }, 5 * 60 * 1000);
}

export default globalCache;
export { MemoryCache };
