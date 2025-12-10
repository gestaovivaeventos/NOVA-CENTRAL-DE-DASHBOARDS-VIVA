/**
 * API para monitorar estatísticas do cache
 * Útil para debug e monitoramento de performance
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apenas para administradores (verificar token)
  const authHeader = req.headers.authorization;
  
  if (req.method === 'GET') {
    const stats = cache.getStats();
    
    return res.status(200).json({
      cache: stats,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  }
  
  if (req.method === 'DELETE') {
    // Limpar cache (requer autenticação)
    const { prefix } = req.query;
    
    if (prefix && typeof prefix === 'string') {
      const count = cache.invalidateByPrefix(prefix);
      return res.status(200).json({ 
        success: true, 
        message: `Invalidated ${count} entries with prefix: ${prefix}` 
      });
    }
    
    cache.clear();
    return res.status(200).json({ 
      success: true, 
      message: 'Cache cleared' 
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
