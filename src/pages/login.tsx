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
          unitNames: data.user.unitNames || []
        };
        localStorage.setItem('auth_user', JSON.stringify(userObj));
        
        // Também salvar campos individuais para compatibilidade
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('firstName', data.user.firstName);
        localStorage.setItem('accessLevel', String(data.user.accessLevel));
        if (data.user.unitNames && data.user.unitNames.length > 0) {
          localStorage.setItem('unitNames', JSON.stringify(data.user.unitNames));
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
          background-image: url('/images/capa_site.png');
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
          font-size: 1.6em;
          font-weight: bold;
          color: #F8F9FA;
          margin: 0;
        }

        .sub-heading {
          font-size: 1em;
          color: #adb5bd;
          margin-top: 5px;
        }

        .access-control {
          background-color: rgba(33, 37, 41, 0.95);
          padding: 40px 30px;
          border-radius: 10px;
          border: 1px solid #495057;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .access-control input {
          background-color: #212529;
          border: 1px solid #495057;
          color: #F8F9FA;
          border-radius: 6px;
          padding: 12px 15px;
          text-align: center;
          font-size: 1.2em;
          width: 280px;
          letter-spacing: 1px;
          box-sizing: border-box;
        }

        .access-control input::placeholder {
          letter-spacing: 0.5px;
          font-size: 0.9em;
          color: #adb5bd;
        }

        .access-control input:focus {
          outline: none;
          box-shadow: 0 0 0 2px #FF6600;
          border-color: #FF6600;
        }

        .access-control button {
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
          width: 280px;
        }

        .access-control button:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(0,0,0,0.45);
        }

        .access-control button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          color: #dc3545;
          font-weight: bold;
        }

        .company-logo {
          height: 60px;
          width: auto;
          margin-top: 15px;
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
          gap: 20px;
          width: 100%;
        }

        .form-group {
          width: 100%;
        }

        .forgot-password-link {
          margin-top: 15px;
        }

        .forgot-password-link a {
          font-size: 0.9em;
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
          display: flex;
          justify-content: center;
        }

        .password-wrapper input {
          padding-right: 50px;
          width: 280px;
        }

        .password-toggle {
          position: absolute;
          right: calc(50% - 140px + 15px);
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

      <div id="login-screen">
        <div id="login-container">
          <h1 className="page-title">CENTRAL DE DASHBOARDS</h1>
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
