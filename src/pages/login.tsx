/**
 * Página de Login - Autenticação simples com usuário/senha
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface LoginFormState {
  username: string;
  password: string;
  loading: boolean;
  error: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<LoginFormState>({
    username: '',
    password: '',
    loading: false,
    error: ''
  });
  const [showPassword, setShowPassword] = useState(false);

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

    if (!formState.username.trim()) {
      setFormState(prev => ({
        ...prev,
        error: 'Por favor, informe seu usuário'
      }));
      return;
    }

    if (!formState.password.trim()) {
      setFormState(prev => ({
        ...prev,
        error: 'Por favor, informe sua senha'
      }));
      return;
    }

    setFormState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: formState.username,
          password: formState.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Salvar token e dados do usuário no localStorage
        localStorage.setItem('auth_token', data.token);
        
        // Salvar usuário no formato que o AuthContext espera
        const userObj = {
          id: data.user.username,
          username: data.user.username,
          firstName: data.user.firstName,
          accessLevel: data.user.accessLevel,
          unitNames: data.user.unitNames || [],
          unitPrincipal: data.user.unitPrincipal || ''
        };
        localStorage.setItem('auth_user', JSON.stringify(userObj));
        
        // Também salvar campos individuais para compatibilidade
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('firstName', data.user.firstName);
        localStorage.setItem('accessLevel', String(data.user.accessLevel));
        if (data.user.unitNames && data.user.unitNames.length > 0) {
          localStorage.setItem('unitNames', JSON.stringify(data.user.unitNames));
        }
        if (data.user.unitPrincipal) {
          localStorage.setItem('unitPrincipal', data.user.unitPrincipal);
        }
        
        // Redirecionar para página principal usando window.location
        window.location.href = '/';
      } else {
        setFormState(prev => ({
          ...prev,
          error: data.message || 'Erro ao realizar login'
        }));
      }
    } catch (err) {
      setFormState(prev => ({
        ...prev,
        error: 'Erro de conexão. Tente novamente.'
      }));
      console.error('Login error:', err);
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <>
      <Head>
        <title>Login - PEX Dashboard</title>
        <meta name="description" content="Acesso ao PEX Dashboard" />
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
          height: 100vh;
          font-family: 'Poppins', sans-serif;
          background-color: #212529;
          background-image: url('/images/capa_site_nova_hd.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          color: #F8F9FA;
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
          font-size: clamp(0.9em, 2.5vw, 1.8em);
          background: linear-gradient(180deg, #ffffff, #e9e9e9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 4px 8px rgba(0,0,0,0.7);
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-align: center;
          white-space: nowrap;
          padding: 0 10px;
        }

        .login-heading {
          text-align: center;
          margin-bottom: 5px;
        }

        .main-heading {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.6em;
          font-weight: 700;
          color: #F8F9FA;
          margin: 0;
          letter-spacing: 1px;
        }

        .sub-heading {
          font-size: 1em;
          color: #adb5bd;
          margin-top: 5px;
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
          padding: 40px 35px;
          border-radius: 16px;
          border: 1px solid rgba(255, 140, 50, 0.2);
          border-top-color: rgba(255, 255, 255, 0.08);
          border-left-color: rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          max-width: 420px;
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

        /* Textura metálica (pseudo-element) */
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

        /* Brilho sutil no topo */
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

        .access-control input {
          background-color: rgba(20, 22, 25, 0.9);
          border: 1px solid rgba(255, 140, 50, 0.2);
          color: #F8F9FA;
          border-radius: 8px;
          padding: 14px 16px;
          text-align: left;
          font-size: 1em;
          width: 100%;
          letter-spacing: 0.5px;
          box-sizing: border-box;
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .access-control input::placeholder {
          letter-spacing: 0.5px;
          font-size: 0.9em;
          color: #6c757d;
        }

        .access-control input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(255, 102, 0, 0.4);
          border-color: #FF6600;
        }

        .access-control button[type="submit"] {
          background: linear-gradient(180deg, #ff8a33 0%, #FF6600 50%, #D35400 100%);
          color: #212529;
          border: 1px solid #A6300C;
          border-top-color: #ff9c4d;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(255, 102, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.15);
          text-shadow: 0 1px 1px rgba(0,0,0,0.2);
          padding: 14px 25px;
          font-weight: bold;
          cursor: pointer;
          font-size: 1.1em;
          letter-spacing: 0.5px;
          transition: all 0.25s ease;
          width: 100%;
        }

        .access-control button[type="submit"]:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 102, 0, 0.4);
        }

        .access-control button[type="submit"]:disabled {
          opacity: 0.7;
          cursor: not-allowed;
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

        .error-message {
          color: #dc3545;
          font-weight: bold;
          font-size: 0.9em;
        }

        .company-logo {
          height: 50px;
          width: auto;
          margin-top: 5px;
          opacity: 0.9;
        }

        #login-screen {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100vh;
          padding: 15px;
          box-sizing: border-box;
        }

        #login-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .form-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          width: 100%;
        }

        .form-group {
          width: 100%;
        }

        .forgot-password-link {
          margin-top: 2px;
        }

        .forgot-password-link a {
          font-size: 0.85em;
          color: #adb5bd;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .forgot-password-link a:hover {
          color: #FF6600;
        }

        .password-wrapper {
          position: relative;
          width: 100%;
        }

        .password-wrapper input {
          padding-right: 55px;
          width: 100%;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #adb5bd;
          cursor: pointer;
          font-size: 0.85em;
          padding: 0;
          transition: color 0.2s ease;
          z-index: 1;
        }

        .password-toggle:hover {
          color: #FF6600;
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

      <div id="login-screen">
        <div id="login-container">
          <h1 className="page-title">CENTRAL DE DASHBOARDS</h1>
          <div className="card-wrapper">
            <section className="access-control">
              <div className="login-heading">
                <h3 className="main-heading">Bem-vindo!</h3>
                <p className="sub-heading">Faça o seu login</p>
              </div>
              
              <form onSubmit={handleSubmit} className="form-container">
                {/* Campo Username */}
                <div className="form-group">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formState.username}
                    onChange={handleInputChange}
                    placeholder="Usuário"
                    disabled={formState.loading}
                    maxLength={20}
                  />
                </div>

                {/* Campo Senha */}
                <div className="form-group">
                  <div className="password-wrapper">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formState.password}
                      onChange={handleInputChange}
                      placeholder="Senha"
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

              {/* Mensagem de Erro */}
              {formState.error && (
                <p className="error-message">{formState.error}</p>
              )}

              {/* Botão de Login */}
              <button type="submit" disabled={formState.loading}>
                {formState.loading ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>

            {/* Link Redefinir Senha */}
            <div className="forgot-password-link">
              <a href="/reset-password">Primeiro acesso / Esqueceu sua senha?</a>
            </div>

            <div className="divider" />

            <div className="logo-wrapper">
              <svg className="logo-circuit-left" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Linha principal */}
                <line x1="0" y1="25" x2="60" y2="25" stroke="rgba(255,140,50,0.35)" strokeWidth="1"/>
                <circle cx="60" cy="25" r="2.5" fill="rgba(255,140,50,0.5)"/>
                {/* Ramal superior */}
                <line x1="5" y1="10" x2="35" y2="10" stroke="rgba(255,140,50,0.25)" strokeWidth="0.8"/>
                <line x1="35" y1="10" x2="45" y2="18" stroke="rgba(255,140,50,0.2)" strokeWidth="0.8"/>
                <circle cx="35" cy="10" r="1.5" fill="rgba(255,140,50,0.35)"/>
                <rect x="42" y="15" width="5" height="5" rx="1" stroke="rgba(255,140,50,0.3)" strokeWidth="0.7" fill="none"/>
                {/* Ramal inferior */}
                <line x1="10" y1="40" x2="50" y2="40" stroke="rgba(255,140,50,0.25)" strokeWidth="0.8"/>
                <circle cx="50" cy="40" r="2" fill="rgba(255,140,50,0.4)"/>
                <line x1="50" y1="40" x2="55" y2="32" stroke="rgba(255,140,50,0.2)" strokeWidth="0.8"/>
                {/* Nó intermediário */}
                <line x1="25" y1="25" x2="25" y2="15" stroke="rgba(255,140,50,0.15)" strokeWidth="0.8"/>
                <circle cx="25" cy="15" r="1" fill="rgba(255,140,50,0.25)"/>
              </svg>
              <img className="company-logo" src="/images/logo_viva.png" alt="Logo Viva Eventos" />
              <svg className="logo-circuit-right" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Linha principal */}
                <line x1="80" y1="25" x2="20" y2="25" stroke="rgba(255,140,50,0.35)" strokeWidth="1"/>
                <circle cx="20" cy="25" r="2.5" fill="rgba(255,140,50,0.5)"/>
                {/* Ramal superior */}
                <line x1="75" y1="10" x2="45" y2="10" stroke="rgba(255,140,50,0.25)" strokeWidth="0.8"/>
                <line x1="45" y1="10" x2="35" y2="18" stroke="rgba(255,140,50,0.2)" strokeWidth="0.8"/>
                <circle cx="45" cy="10" r="1.5" fill="rgba(255,140,50,0.35)"/>
                <rect x="33" y="15" width="5" height="5" rx="1" stroke="rgba(255,140,50,0.3)" strokeWidth="0.7" fill="none"/>
                {/* Ramal inferior */}
                <line x1="70" y1="40" x2="30" y2="40" stroke="rgba(255,140,50,0.25)" strokeWidth="0.8"/>
                <circle cx="30" cy="40" r="2" fill="rgba(255,140,50,0.4)"/>
                <line x1="30" y1="40" x2="25" y2="32" stroke="rgba(255,140,50,0.2)" strokeWidth="0.8"/>
                {/* Nó intermediário */}
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
