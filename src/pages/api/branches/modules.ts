/**
 * API Route - Lista módulos dinamicamente a partir de src/modules
 * GET: retorna array de nomes de pastas em src/modules
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const modulesDir = path.join(process.cwd(), 'src', 'modules');
    const entries = fs.readdirSync(modulesDir, { withFileTypes: true });
    const modules = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();

    res.status(200).json({ modules });
  } catch (error) {
    console.error('Erro ao listar módulos:', error);
    res.status(500).json({ error: 'Erro ao listar módulos' });
  }
}
