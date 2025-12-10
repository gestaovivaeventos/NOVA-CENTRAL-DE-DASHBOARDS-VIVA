/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
