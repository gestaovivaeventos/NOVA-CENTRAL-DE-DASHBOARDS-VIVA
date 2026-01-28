/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ignorar erros de ESLint durante o build (para deploy mais rápido)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignorar erros de TypeScript durante o build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Otimização de imagens
  images: {
    domains: ['localhost'],
  },
  // Configuração de ambiente
  env: {
    APP_NAME: 'Projeto Central',
    APP_VERSION: '1.0.0',
  },
};

module.exports = nextConfig;
