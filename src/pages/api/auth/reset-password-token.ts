/**
 * API Route: Reset Password com Token Dinâmico
 * POST /api/auth/reset-password-token
 * 
 * Permite que usuários redefinam suas senhas usando token dinâmico da planilha
 * Token é armazenado na coluna Q (Token_Reset_Admin) e é atualizado dinamicamente
 * Senha é atualizada em TODAS as linhas do usuário na coluna P (Senha_Hash)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { 
  findUserByUsername, 
  updateUserPassword,
  validateResetToken 
} from '@/utils/authSheets';

interface ResetPasswordRequest {
  username: string;
  resetToken: string;
  newPassword: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResetPasswordResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  console.log('[RESET-PASSWORD] Requisição iniciada');

  const { username, resetToken, newPassword } = req.body as ResetPasswordRequest;

  // Validações básicas
  if (!username || !resetToken || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Username, reset token e nova senha são obrigatórios'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'A senha deve ter no mínimo 8 caracteres'
    });
  }

  try {
    console.log(`[RESET-PASSWORD] Buscando usuário: ${username}`);
    // Buscar usuário e tokens da planilha
    const user = await findUserByUsername(username);
    
    if (!user) {
      console.log(`[RESET-PASSWORD] Usuário ${username} não encontrado`);
      return res.status(401).json({
        success: false,
        message: 'Usuário ou token inválido'
      });
    }

    console.log(`[RESET-PASSWORD] Usuário encontrado, validando token...`);
    // Validar token de forma condicional baseado no estado da senha
    if (!validateResetToken(resetToken, user.senhaHash, user.tokenResetAdmin, user.tokenPrimeiraSenha)) {
      console.log(`[RESET-PASSWORD] Token inválido para ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Token de redefinição inválido ou expirado'
      });
    }

    console.log(`[RESET-PASSWORD] Token válido, hashando nova senha...`);
    // Hash da nova senha com bcrypt (10 rounds)
    const newHash = await bcrypt.hash(newPassword, 10);

    console.log(`[RESET-PASSWORD] Atualizando senha na linha ${user.rowIndex}...`);
    // Atualizar senha NA MESMA LINHA onde encontrou o usuário (coluna C)
    const updateSuccess = await updateUserPassword(user.rowIndex, newHash);

    if (!updateSuccess) {
      console.log(`[RESET-PASSWORD] Erro ao atualizar senha`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar senha. Tente novamente.'
      });
    }

    console.log(`✅ Senha atualizada na linha ${user.rowIndex} para ${username}`);

    return res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}
