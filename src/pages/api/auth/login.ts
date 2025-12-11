import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { LoginResponse, User } from '@/types/auth.types';

// ============================================
// Interfaces
// ============================================

interface SheetUser {
  username: string;
  name: string;
  accessLevel: 0 | 1;
  unitNames: string[];
  enabled: boolean;
}

interface PasswordUser {
  username: string;
  senhaHash: string;
}

// ============================================
// Buscar usuários da aba principal (permissões)
// ============================================

async function getAuthorizedUsers(): Promise<SheetUser[]> {
  try {
    const sheetId = process.env.GOOGLE_ACCESS_CONTROL_SHEET_ID;
    if (!sheetId) {
      console.error('GOOGLE_ACCESS_CONTROL_SHEET_ID não configurado');
      return [];
    }

    // URL para ler a planilha em formato CSV (aba principal gid=0)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

    const response = await fetch(csvUrl);
    if (!response.ok) {
      console.error(`Erro ao buscar CSV: ${response.status}`);
      return [];
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n');

    // Colunas esperadas (do Novo Pex):
    // B (índice 1) = nm_unidade (unidade vinculada)
    // C (índice 2) = nm_unidade_principal_desc (descrição da unidade principal)
    // D (índice 3) = nome (full name)
    // E (índice 4) = username
    // F (índice 5) = enabled (TRUE/FALSE)
    // L (índice 11) = nvl_acesso_unidade (0 = franqueado, 1 = franqueadora)

    // Agrupar por username para coletar todas as unidades
    const userMap = new Map<string, {
      name: string;
      accessLevel: 0 | 1;
      unitNames: Set<string>;
      enabled: boolean;
    }>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cells = parseCSVLine(line);
      if (cells.length > 11) {
        const unitName = cells[1]?.trim().replace(/^"|"$/g, ''); // Coluna B
        const unitPrincipalDesc = cells[2]?.trim().replace(/^"|"$/g, ''); // Coluna C
        const name = cells[3]?.trim().replace(/^"|"$/g, ''); // Coluna D
        const username = cells[4]?.trim().replace(/^"|"$/g, ''); // Coluna E
        const enabledStr = cells[5]?.trim().replace(/^"|"$/g, '').toUpperCase(); // Coluna F
        const accessLevelStr = cells[11]?.trim().replace(/^"|"$/g, ''); // Coluna L

        const enabled = enabledStr === 'TRUE';
        const accessLevel = accessLevelStr === '1' ? 1 : (accessLevelStr === '0' ? 0 : null);

        if (username && name && accessLevel !== null && enabled) {
          if (!userMap.has(username)) {
            userMap.set(username, {
              name,
              accessLevel,
              unitNames: new Set(),
              enabled
            });
          }

          const user = userMap.get(username)!;
          if (unitPrincipalDesc) {
            // Usar nm_unidade_principal_desc para todos os tipos de usuário
            user.unitNames.add(unitPrincipalDesc);
          }
        }
      }
    }

    // Converter para array
    const users: SheetUser[] = [];
    userMap.forEach((user, username) => {
      users.push({
        username,
        name: user.name,
        accessLevel: user.accessLevel,
        unitNames: Array.from(user.unitNames).sort(),
        enabled: user.enabled
      });
    });

    console.log(`[Auth] Encontrados ${users.length} usuários autorizados`);
    return users;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
}

// ============================================
// Buscar senha da aba SENHAS
// ============================================

async function findUserPassword(username: string): Promise<PasswordUser | null> {
  try {
    const sheetId = process.env.GOOGLE_ACCESS_CONTROL_SHEET_ID;
    if (!sheetId) return null;

    // Buscar gid da aba SENHAS via Google Sheets API
    const serviceAccountBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) {
      console.error('GOOGLE_SERVICE_ACCOUNT_BASE64 não configurado');
      return null;
    }

    const { google } = await import('googleapis');
    
    const serviceAccountJson = JSON.parse(
      Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
    );

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountJson,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Obter metadados para encontrar aba SENHAS
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: sheetId
    });

    let senhasGid: number | null = null;
    for (const sheet of metadata.data.sheets || []) {
      if (sheet.properties?.title?.toUpperCase() === 'SENHAS') {
        senhasGid = sheet.properties.sheetId ?? null;
        break;
      }
    }

    if (senhasGid === null) {
      console.error('Aba SENHAS não encontrada');
      return null;
    }

    // Buscar CSV da aba SENHAS
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${senhasGid}`;
    const response = await fetch(csvUrl);

    if (!response.ok) {
      console.error(`Erro ao buscar aba SENHAS: ${response.status}`);
      return null;
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');

    // Encontrar índices das colunas
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const usernameIdx = headers.findIndex(h => h.includes('username'));
    const senhaIdx = headers.findIndex(h => h.includes('senha') && !h.includes('token'));

    if (usernameIdx === -1 || senhaIdx === -1) {
      console.error('Colunas username/senha não encontradas na aba SENHAS');
      return null;
    }

    // Procurar usuário
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cells = parseCSVLine(line);
      const cellUsername = cells[usernameIdx]?.trim().replace(/^"|"$/g, '');
      const cellSenha = cells[senhaIdx]?.trim().replace(/^"|"$/g, '');

      if (cellUsername === username && cellSenha) {
        return {
          username: cellUsername,
          senhaHash: cellSenha
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar senha:', error);
    return null;
  }
}

// ============================================
// Parse CSV respeitando aspas
// ============================================

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

// ============================================
// Handler da API
// ============================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido',
    });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuário e senha são obrigatórios',
      });
    }

    console.log(`[Login] Tentativa de login: ${username}`);

    // 1. Buscar usuário na lista de autorizados
    const authorizedUsers = await getAuthorizedUsers();
    const sheetUser = authorizedUsers.find(u => u.username === username);

    if (!sheetUser) {
      console.log(`[Login] Usuário não encontrado: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Usuário ou senha inválidos',
      });
    }

    // 2. Buscar senha hash na aba SENHAS
    const passwordUser = await findUserPassword(username);

    if (!passwordUser) {
      console.log(`[Login] Senha não encontrada para: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Usuário ou senha inválidos',
      });
    }

    // 3. Validar senha com bcrypt
    const passwordMatch = await bcrypt.compare(password, passwordUser.senhaHash);

    if (!passwordMatch) {
      console.log(`[Login] Senha incorreta para: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Usuário ou senha inválidos',
      });
    }

    // 4. Extrair primeiro nome formatado
    const nameParts = sheetUser.name.split(' ');
    const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();

    // 5. Gerar token (Base64 do JSON)
    const tokenData = JSON.stringify({
      username: username,
      accessLevel: sheetUser.accessLevel,
      unitNames: sheetUser.unitNames || []
    });
    const token = Buffer.from(tokenData).toString('base64');

    // 6. Criar objeto User
    const user: User = {
      id: `user_${Date.now()}`,
      username: username,
      firstName: firstName,
      accessLevel: sheetUser.accessLevel,
      unitNames: sheetUser.unitNames,
    };

    console.log(`[Login] Sucesso: ${username} (nível ${sheetUser.accessLevel})`);

    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user,
    });

  } catch (error) {
    console.error('[Login] Erro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
}
