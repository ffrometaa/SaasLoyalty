const path = require('path');
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@loyalty-os/ui', '@loyalty-os/config', '@loyalty-os/db', '@loyalty-os/email'],
  images: {
    remotePatterns: [
      // Supabase Storage — tenant logos, brand assets
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
};

module.exports = withNextIntl(nextConfig);
