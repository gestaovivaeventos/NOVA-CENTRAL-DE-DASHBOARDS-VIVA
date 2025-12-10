/**
 * Página de Redefinição de Senha
 * Permite que usuários redefinam sua senha usando um token fornecido pelo admin
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface ResetPasswordFormState {
  username: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  error: string;
  success: boolean;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<ResetPasswordFormState>({
    username: '',
    resetToken: '',
    newPassword: '',
    confirmPassword: '',
    loading: false,
    error: '',
    success: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value,
      error: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validações
    if (!formState.username.trim()) {
      setFormState(prev => ({
        ...prev,
        error: 'Por favor, informe seu usuário'
      }));
      return;
    }

    if (!formState.resetToken.trim()) {
      setFormState(prev => ({
        ...prev,
        error: 'Por favor, informe o token de redefinição'
      }));
      return;
    }

    if (!formState.newPassword.trim()) {
      setFormState(prev => ({
        ...prev,
        error: 'Por favor, informe a nova senha'
      }));
      return;
    }

    if (formState.newPassword.length < 8) {
      setFormState(prev => ({
        ...prev,
        error: 'A senha deve ter no mínimo 8 caracteres'
      }));
      return;
    }

    if (formState.newPassword !== formState.confirmPassword) {
      setFormState(prev => ({
        ...prev,
        error: 'As senhas não conferem'
      }));
      return;
    }

    setFormState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await fetch('/api/auth/reset-password-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formState.username,
          resetToken: formState.resetToken,
          newPassword: formState.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFormState(prev => ({
          ...prev,
          success: true,
          error: ''
        }));
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setFormState(prev => ({
          ...prev,
          error: data.message || 'Erro ao redefinir senha'
        }));
      }
    } catch (err) {
      setFormState(prev => ({
        ...prev,
        error: 'Erro de conexão. Tente novamente.'
      }));
      console.error('Reset password error:', err);
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <>
      <Head>
        <title>Redefinir Senha - Central de Dashboards</title>
        <meta name="description" content="Redefinir senha da Central de Dashboards" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          width: 100vw;
          height: 100vh;
          font-family: 'Poppins', sans-serif;
          background-color: #212529;
          background-image: url('/images/capa_site.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          color: #F8F9FA;
          position: fixed;
          top: 0;
          left: 0;
          overflow: hidden;
        }

        #__next {
          width: 100%;
          height: 100%;
        }
      `}</style>

      <style jsx>{`
        .page-title {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 2em;
          background: linear-gradient(180deg, #ffffff, #e9e9e9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 4px 8px rgba(0,0,0,0.7);
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          text-align: center;
          max-width: 900px;
          line-height: 1.2;
        }

        .page-subtitle {
          font-size: 1.2em;
          font-weight: 600;
          color: #F8F9FA;
          margin-bottom: 8px;
        }

        .page-description {
          font-size: 0.85em;
          color: #adb5bd;
          margin-bottom: 20px;
        }

        .access-control {
          background-color: rgba(33, 37, 41, 0.95);
          padding: 25px 25px;
          border-radius: 10px;
          border: 1px solid #495057;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .form-group {
          width: 100%;
        }

        .form-label {
          display: block;
          font-size: 0.85em;
          font-weight: 600;
          color: #adb5bd;
          margin-bottom: 5px;
        }

        .form-input {
          background-color: #212529;
          border: 1px solid #495057;
          color: #F8F9FA;
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 0.95em;
          width: 100%;
          letter-spacing: 0.5px;
          box-sizing: border-box;
        }

        .form-input::placeholder {
          color: #6c757d;
          font-size: 0.9em;
        }

        .form-input:focus {
          outline: none;
          box-shadow: 0 0 0 2px #FF6600;
          border-color: #FF6600;
        }

        .form-helper {
          font-size: 0.85em;
          color: #6c757d;
          margin-top: 5px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #adb5bd;
          cursor: pointer;
          font-size: 0.85em;
          padding: 0;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #FF6600;
        }

        .password-wrapper {
          position: relative;
        }

        .error-message {
          color: #dc3545;
          font-weight: 600;
          background-color: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
        }

        .success-message {
          color: #6fd97c;
          font-weight: 600;
          background-color: rgba(40, 167, 69, 0.1);
          border: 1px solid #28a745;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
        }

        .form-content button[type="submit"] {
          background: linear-gradient(180deg, #ff8a33 0%, #FF6600 50%, #D35400 100%);
          color: #212529;
          border: 1px solid #A6300C;
          border-top-color: #ff9c4d;
          border-radius: 6px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
          text-shadow: 0 1px 1px rgba(0,0,0,0.2);
          padding: 12px 25px;
          font-weight: bold;
          cursor: pointer;
          font-size: 1.1em;
          letter-spacing: 0.5px;
          transition: all 0.2s ease;
          width: 100%;
        }

        .form-content button[type="submit"]:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(0,0,0,0.45);
        }

        .form-content button[type="submit"]:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .back-link {
          margin-top: 15px;
          text-align: center;
        }

        .back-link a {
          font-size: 0.9em;
          color: #adb5bd;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .back-link a:hover {
          color: #FF6600;
        }

        #reset-password-screen {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 20px;
          box-sizing: border-box;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1;
        }

        #reset-password-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .form-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .token-input {
          font-family: monospace;
          font-size: 0.95em;
        }

        .password-input {
          padding-right: 45px;
        }

        .company-logo {
          height: 60px;
          width: auto;
          margin-top: 20px;
        }

        footer {
          position: fixed;
          bottom: 16px;
          left: 16px;
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          font-size: 0.75rem;
          color: #6c757d;
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.3px;
          z-index: 100;
          opacity: 0.8;
        }
      `}</style>

      <div id="reset-password-screen">
        <div id="reset-password-container">
          <h1 className="page-title">Central de Dashboards<br/>Viva Eventos</h1>
          <section className="access-control">
            <h2 className="page-subtitle">Redefinir Senha</h2>
            <p className="page-description">Digite o token que você recebeu do administrador</p>

            {/* Mensagem de Sucesso */}
            {formState.success && (
              <div className="success-message">
                ✓ Senha redefinida com sucesso! Redirecionando para login...
              </div>
            )}

            {/* Formulário */}
            {!formState.success && (
              <form onSubmit={handleSubmit} className="form-content">
                {/* Campo Username */}
                <div className="form-group">
                  <label className="form-label" htmlFor="username">Usuário</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    className="form-input"
                    value={formState.username}
                    onChange={handleInputChange}
                    placeholder="Informe seu usuário"
                    disabled={formState.loading}
                    maxLength={20}
                  />
                </div>

                {/* Campo Token de Redefinição */}
                <div className="form-group">
                  <label className="form-label" htmlFor="resetToken">Token de Redefinição</label>
                  <input
                    id="resetToken"
                    name="resetToken"
                    type="text"
                    className="form-input token-input"
                    value={formState.resetToken}
                    onChange={handleInputChange}
                    placeholder="Cole o token fornecido pelo admin"
                    disabled={formState.loading}
                  />
                  <p className="form-helper">O token deve ser fornecido por um administrador</p>
                </div>

                {/* Campo Nova Senha */}
                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">Nova Senha</label>
                  <div className="password-wrapper">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input password-input"
                      value={formState.newPassword}
                      onChange={handleInputChange}
                      placeholder="Mínimo 8 caracteres"
                      disabled={formState.loading}
                    />
                    <span
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Ocultar' : 'Ver'}
                    </span>
                  </div>
                </div>

                {/* Campo Confirmar Senha */}
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Confirmar Senha</label>
                  <div className="password-wrapper">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input password-input"
                      value={formState.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirme a nova senha"
                      disabled={formState.loading}
                    />
                    <span
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? 'Ocultar' : 'Ver'}
                    </span>
                  </div>
                </div>

                {/* Mensagem de Erro */}
                {formState.error && (
                  <div className="error-message">{formState.error}</div>
                )}

                {/* Botão de Redefinir */}
                <button type="submit" disabled={formState.loading}>
                  {formState.loading ? 'Redefinindo...' : 'Redefinir Senha'}
                </button>
              </form>
            )}

            {/* Link para Login */}
            <div className="back-link">
              <a href="/login">Voltar para Login</a>
            </div>
          </section>
          
          <img className="company-logo" src="/images/logo_viva.png" alt="Logo Viva Eventos" />
        </div>
      </div>

      <footer>
        📊 Developed by Gestão de Dados - VIVA Eventos Brasil 2025
      </footer>
    </>
  );
}
