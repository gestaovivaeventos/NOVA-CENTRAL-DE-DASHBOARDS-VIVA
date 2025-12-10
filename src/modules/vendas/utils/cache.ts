/**
 * Utilitário de cache simples para armazenar dados em memória
 * Reduz chamadas repetidas às APIs
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutos por padrão

  /**
   * Obtém um valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Define um valor no cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt,
    });
  }

  /**
   * Remove um valor do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Verifica se uma chave existe e não está expirada
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Obtém a idade do cache em milissegundos
   */
  getAge(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return Date.now() - entry.timestamp;
  }
}

// Instância global do cache (client-side)
export const clientCache = new SimpleCache();

// Cache keys
export const CACHE_KEYS = {
  SALES_DATA: 'sales_data',
  METAS_DATA: 'metas_data',
  FUNDOS_DATA: 'fundos_data',
};

// TTL em milissegundos (aumentados para melhor performance)
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,    // 5 minutos
  MEDIUM: 10 * 60 * 1000,  // 10 minutos
  LONG: 30 * 60 * 1000,    // 30 minutos
};

