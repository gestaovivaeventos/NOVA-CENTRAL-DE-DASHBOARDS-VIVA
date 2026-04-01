/**
 * API Route - Buscar dados de usuários e senhas (somente leitura)
 * GET: retorna dados combinados da aba principal (gid=0) + aba SENHAS
 * Acesso restrito a franqueadora (accessLevel >= 1)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

const CACHE_KEY = 'controle-usuarios:data';
const CACHE_TTL = 60 * 1000; // 1 minuto

// Parse CSV respeitando aspas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function cleanCell(val: string | undefined): string {
  return (val || '').trim().replace(/^"|"$/g, '');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const forceRefresh = req.query.refresh === 'true';
    if (forceRefresh) {
      cache.invalidate(CACHE_KEY);
    }

    const usuarios = await cache.getOrFetch(
      CACHE_KEY,
      async () => {
        const sheetId = process.env.GOOGLE_ACCESS_CONTROL_SHEET_ID;
        const serviceAccountBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;

        if (!sheetId || !serviceAccountBase64) {
          throw new Error('Variáveis de ambiente não configuradas (GOOGLE_ACCESS_CONTROL_SHEET_ID / GOOGLE_SERVICE_ACCOUNT_BASE64)');
        }

        const serviceAccountJson = JSON.parse(
          Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
        );

        const auth = new google.auth.GoogleAuth({
          credentials: serviceAccountJson,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // ---- 1. Buscar dados da aba principal (gid=0) ----
        const mainCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
        const mainResponse = await fetch(mainCsvUrl);
        if (!mainResponse.ok) {
          throw new Error(`Erro ao buscar aba principal: ${mainResponse.status}`);
        }
        const mainCsv = await mainResponse.text();
        const mainLines = mainCsv.split('\n');

        // Colunas da aba principal:
        // B (1) = nm_unidade
        // C (2) = nm_unidade_principal_desc
        // D (3) = nome
        // E (4) = username
        // F (5) = enabled
        // G (6) = nm_grupo (cargo)
        // L (11) = nvl_acesso_unidade

        interface MainUser {
          unidadePrincipal: string;
          unidade: string;
          nome: string;
          username: string;
          enabled: string;
          nmGrupo: string;
        }

        const mainUsers: MainUser[] = [];
        for (let i = 1; i < mainLines.length; i++) {
          const line = mainLines[i].trim();
          if (!line) continue;
          const cells = parseCSVLine(line);
          const username = cleanCell(cells[4]);
          if (!username) continue;

          mainUsers.push({
            unidadePrincipal: cleanCell(cells[2]),
            unidade: cleanCell(cells[1]),
            nome: cleanCell(cells[3]),
            username,
            enabled: cleanCell(cells[5]).toUpperCase() === 'TRUE' ? 'Ativo' : 'Inativo',
            nmGrupo: cleanCell(cells[8]),
          });
        }

        // ---- 1b. Deduplicar por username (manter apenas registro da unidade principal) ----
        const userMap = new Map<string, MainUser>();
        for (const u of mainUsers) {
          const existing = userMap.get(u.username);
          if (!existing) {
            userMap.set(u.username, u);
          } else {
            // Preferir o registro onde unidade === unidadePrincipal
            if (u.unidade === u.unidadePrincipal && existing.unidade !== existing.unidadePrincipal) {
              userMap.set(u.username, u);
            }
          }
        }
        const dedupedUsers = Array.from(userMap.values());

        // ---- 2. Buscar dados da aba SENHAS ----
        const metadata = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
        let senhasGid: number | null = null;
        for (const sheet of metadata.data.sheets || []) {
          if (sheet.properties?.title?.toUpperCase() === 'SENHAS') {
            senhasGid = sheet.properties.sheetId ?? null;
            break;
          }
        }

        // Mapa de senhas/tokens por username
        const senhasMap = new Map<string, {
          senhaHash: string;
          tokenResetAdmin: string;
          tokenPrimeiraSenha: string;
        }>();

        if (senhasGid !== null) {
          const senhasCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${senhasGid}`;
          const senhasResponse = await fetch(senhasCsvUrl);
          if (senhasResponse.ok) {
            const senhasCsv = await senhasResponse.text();
            const senhasLines = senhasCsv.split('\n');

            // Descobrir índices dos headers dinamicamente
            const headers = parseCSVLine(senhasLines[0]).map(h => h.toLowerCase().trim().replace(/^"|"$/g, ''));
            const usernameIdx = headers.findIndex(h => h.includes('username'));
            const senhaIdx = headers.findIndex(h => (h.includes('senha') || h.includes('hash')) && !h.includes('token'));
            const tokenResetIdx = headers.findIndex(h => h.includes('token') && h.includes('reset'));
            const tokenPrimeiraIdx = headers.findIndex(h => h.includes('token') && h.includes('primeira'));

            for (let i = 1; i < senhasLines.length; i++) {
              const line = senhasLines[i].trim();
              if (!line) continue;
              const cells = parseCSVLine(line);
              const uname = cleanCell(cells[usernameIdx]);
              if (!uname) continue;

              senhasMap.set(uname, {
                senhaHash: senhaIdx >= 0 ? cleanCell(cells[senhaIdx]) : '',
                tokenResetAdmin: tokenResetIdx >= 0 ? cleanCell(cells[tokenResetIdx]) : '',
                tokenPrimeiraSenha: tokenPrimeiraIdx >= 0 ? cleanCell(cells[tokenPrimeiraIdx]) : '',
              });
            }
          }
        }

        // ---- 3. Combinar dados ----
        const combined = dedupedUsers.map(u => {
          const senhaData = senhasMap.get(u.username);
          return {
            ...u,
            senhaHash: senhaData?.senhaHash || '',
            tokenResetAdmin: senhaData?.tokenResetAdmin || '',
            tokenPrimeiraSenha: senhaData?.tokenPrimeiraSenha || '',
          };
        });

        console.log(`[API/controle-usuarios] ${combined.length} registros encontrados`);
        return combined;
      },
      CACHE_TTL
    );

    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).json({ usuarios, cached: true });
  } catch (error: any) {
    console.error('[API/controle-usuarios/data] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
