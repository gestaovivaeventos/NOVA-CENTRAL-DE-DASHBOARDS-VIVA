/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  webpack: (config, { isServer }) => {
    // Resolver conflitos de case-sensitivity no Windows
    config.resolve.symlinks = false;
    return config;
  },
}

module.exports = nextConfig
