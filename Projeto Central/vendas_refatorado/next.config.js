/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Desabilitar source maps em produção para segurança
  productionBrowserSourceMaps: false,
  
  images: {
    domains: [],
    unoptimized: true,
  },
  
  // Suporte a path aliases
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    
    // Em produção, desabilitar source maps completamente
    if (!dev) {
      config.devtool = false;
    }
    
    return config;
  },
  
  // Desabilitar headers que expõem informações
  poweredByHeader: false,
};

module.exports = nextConfig;
