/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@loyalty-os/ui', '@loyalty-os/config', '@loyalty-os/db', '@loyalty-os/email'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
