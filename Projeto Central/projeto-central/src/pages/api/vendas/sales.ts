/**
 * API Route para buscar dados de vendas do Google Sheets
 * Evita problemas de CORS fazendo a chamada server-side
 * Com cache para melhorar performance
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// Cache simples em memória (server-side)
let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutos

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verificar cache (exceto se for requisição forçada)
    const forceRefresh = req.query.refresh === 'true';
    if (!forceRefresh && cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return res.status(200).json({ values: cache.data, cached: true });
    }

    const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_SALES;
    const SHEET_NAME = process.env.NEXT_PUBLIC_SHEET_ADESOES || 'ADESOES';
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!SPREADSHEET_ID || !API_KEY) {
      return res.status(500).json({
        error: 'Configuração incompleta',
        message: 'Variáveis de ambiente do Google Sheets não configuradas',
      });
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/sales] Erro:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Falha ao buscar dados',
        message: errorText,
      });
    }

    const data = await response.json();
    const rows = data.values || [];
    
    // Atualizar cache
    cache = {
      data: rows,
      timestamp: Date.now(),
    };
    
    return res.status(200).json({ values: rows, cached: false });

  } catch (error: any) {
    console.error('[API/sales] Erro:', error);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
