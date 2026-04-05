import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LoyaltyOS',
    short_name: 'LoyaltyOS',
    description: 'White-label loyalty platform for local businesses. Branded member app, automated retention, real-time analytics.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
