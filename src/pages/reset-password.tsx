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
          width: 100%;
          min-height: 100vh;
          font-family: 'Poppins', sans-serif;
          background-color: #212529;
          background-image: url('/images/capa_site_nova_hd.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          color: #F8F9FA;
        }

        #__next {
          width: 100%;
          height: 100%;
        }
      `}</style>

      <style jsx>{`
        .page-subtitle {
          font-family: 'Poppins', sans-serif;
          font-size: 1.4em;
          font-weight: 700;
          color: #F8F9FA;
          margin-bottom: 0;
          letter-spacing: 0.5px;
        }

        .page-description {
          font-size: 0.8em;
          color: #adb5bd;
          margin-bottom: 5px;
        }

        /* ===== Card wrapper com decorações ===== */
        .card-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }


        .access-control {
          background: 
            linear-gradient(135deg, 
              rgba(45, 48, 52, 0.98) 0%, 
              rgba(32, 35, 39, 0.99) 25%, 
              rgba(50, 53, 58, 0.97) 50%, 
              rgba(28, 31, 35, 0.99) 75%, 
              rgba(42, 45, 49, 0.98) 100%
            );
          padding: 25px 28px;
          border-radius: 16px;
          border: 1px solid rgba(255, 140, 50, 0.2);
          border-top-color: rgba(255, 255, 255, 0.08);
          border-left-color: rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          max-width: 400px;
          width: 100%;
          box-shadow: 
            0 0 40px rgba(255, 102, 0, 0.06),
            0 0 80px rgba(255, 102, 0, 0.03),
            0 25px 60px rgba(0, 0, 0, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3),
            inset 2px 0 8px rgba(0, 0, 0, 0.15),
            inset -2px 0 8px rgba(0, 0, 0, 0.15);
          position: relative;
          z-index: 1;
          overflow: hidden;
        }

        .access-control::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, 0.008) 2px,
              rgba(255, 255, 255, 0.008) 4px
            ),
            radial-gradient(ellipse at 30% 20%, rgba(255, 160, 60, 0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(255, 120, 40, 0.03) 0%, transparent 50%);
          border-radius: 16px;
          pointer-events: none;
          z-index: 0;
        }

        .access-control::after {
          content: '';
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 180, 100, 0.2), rgba(255, 255, 255, 0.1), rgba(255, 180, 100, 0.2), transparent);
          pointer-events: none;
          z-index: 0;
        }

        .access-control > * {
          position: relative;
          z-index: 1;
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
          background-color: rgba(20, 22, 25, 0.9);
          border: 1px solid rgba(255, 140, 50, 0.2);
          color: #F8F9FA;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.9em;
          width: 100%;
          letter-spacing: 0.5px;
          box-sizing: border-box;
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .form-input::placeholder {
          color: #6c757d;
          font-size: 0.9em;
        }

        .form-input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(255, 102, 0, 0.4);
          border-color: #FF6600;
        }

        .form-helper {
          font-size: 0.75em;
          color: #6c757d;
          margin-top: 3px;
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
          font-size: 0;
          padding: 0;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
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
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(255, 102, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.15);
          text-shadow: 0 1px 1px rgba(0,0,0,0.2);
          padding: 12px 25px;
          font-weight: bold;
          cursor: pointer;
          font-size: 1em;
          letter-spacing: 0.5px;
          transition: all 0.25s ease;
          width: 100%;
        }

        .form-content button[type="submit"]:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 102, 0, 0.4);
        }

        .form-content button[type="submit"]:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .back-link {
          margin-top: 5px;
          text-align: center;
        }

        .back-link a {
          font-size: 0.9em;
          color: #FF6600;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .back-link a:hover {
          color: #ff8a33;
          text-decoration: underline;
        }

        #reset-password-screen {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 100vh;
          padding: 30px 20px 50px;
          box-sizing: border-box;
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
          gap: 8px;
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
          height: 40px;
          width: auto;
          opacity: 0.9;
        }

        .divider {
          width: 60%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 140, 50, 0.3), transparent);
          margin: 2px 0;
        }

        /* Decoração circuito ao redor do logo */
        .logo-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 0 15px;
        }

        .logo-circuit-left, .logo-circuit-right {
          flex-shrink: 0;
          width: 80px;
          height: 50px;
        }

        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(255,102,0,0.4)); }
          50% { filter: drop-shadow(0 0 12px rgba(255,102,0,1)); }
        }

        .logo-wrapper {
          animation: pulseGlow 3s ease-in-out infinite;
        }

        footer {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          font-size: 0.7rem;
          color: #6c757d;
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.3px;
          z-index: 100;
          opacity: 0.7;
        }
      `}</style>

      <div id="reset-password-screen">
        <div id="reset-password-container">
          <div className="card-wrapper">

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
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
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
                      {showConfirmPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
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

            <div className="divider" />

            <div className="logo-wrapper">
              <svg className="logo-circuit-left" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="25" x2="60" y2="25" stroke="rgba(255,140,50,0.35)" strokeWidth="1"/>
                <circle cx="60" cy="25" r="2.5" fill="rgba(255,140,50,0.5)"/>
                <line x1="5" y1="10" x2="35" y2="10" stroke="rgba(255,140,50,0.25)" strokeWidth="0.8"/>
                <line x1="35" y1="10" x2="45" y2="18" stroke="rgba(255,140,50,0.2)" strokeWidth="0.8"/>
                <circle cx="35" cy="10" r="1.5" fill="rgba(255,140,50,0.35)"/>
                <rect x="42" y="15" width="5" height="5" rx="1" stroke="rgba(255,140,50,0.3)" strokeWidth="0.7" fill="none"/>
                <line x1="10" y1="40" x2="50" y2="40" stroke="rgba(255,140,50,0.25)" strokeWidth="0.8"/>
                <circle cx="50" cy="40" r="2" fill="rgba(255,140,50,0.4)"/>
                <line x1="50" y1="40" x2="55" y2="32" stroke="rgba(255,140,50,0.2)" strokeWidth="0.8"/>
                <line x1="25" y1="25" x2="25" y2="15" stroke="rgba(255,140,50,0.15)" strokeWidth="0.8"/>
                <circle cx="25" cy="15" r="1" fill="rgba(255,140,50,0.25)"/>
              </svg>
              <img className="company-logo" src="/images/logo_viva.png" alt="Logo Viva Eventos" />
              <svg className="logo-circuit-right" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="80" y1="25" x2="20" y2="25" stroke="rgba(255,140,50,0.35)" strokeWidth="1"/>
                <circle cx="20" cy="25" r="2.5" fill="rgba(255,140,50,0.5)"/>
                <line x1="75" y1="10" x2="45" y2="10" stroke="rgba(255,140,50,0.25)" strokeWidth="0.8"/>
                <line x1="45" y1="10" x2="35" y2="18" stroke="rgba(255,140,50,0.2)" strokeWidth="0.8"/>
                <circle cx="45" cy="10" r="1.5" fill="rgba(255,140,50,0.35)"/>
                <rect x="33" y="15" width="5" height="5" rx="1" stroke="rgba(255,140,50,0.3)" strokeWidth="0.7" fill="none"/>
                <line x1="70" y1="40" x2="30" y2="40" stroke="rgba(255,140,50,0.25)" strokeWidth="0.8"/>
                <circle cx="30" cy="40" r="2" fill="rgba(255,140,50,0.4)"/>
                <line x1="30" y1="40" x2="25" y2="32" stroke="rgba(255,140,50,0.2)" strokeWidth="0.8"/>
                <line x1="55" y1="25" x2="55" y2="15" stroke="rgba(255,140,50,0.15)" strokeWidth="0.8"/>
                <circle cx="55" cy="15" r="1" fill="rgba(255,140,50,0.25)"/>
              </svg>
            </div>
          </section>
          </div>
        </div>
      </div>

      <footer>
        📊 Developed by Gestão de Dados - VIVA Eventos Brasil 2025
      </footer>
    </>
  );
}
