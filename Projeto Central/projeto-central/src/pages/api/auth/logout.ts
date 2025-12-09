import type { NextApiRequest, NextApiResponse } from 'next';

interface LogoutResponse {
  success: boolean;
  message: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>
) {
  // Aceita GET ou POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido',
    });
  }

  // Logout é stateless - cliente remove o token
  // Aqui podemos implementar blacklist de tokens se necessário

  return res.status(200).json({
    success: true,
    message: 'Logout realizado com sucesso',
  });
}
