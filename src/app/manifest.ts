import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Tool3 - Powerful All-in-One Token Tool',
    short_name: 'Tool3',
    description:
      'Tool3 is your all-in-one Token Tool providing seamless solutions for token creation, liquidity pool management, secure LP token locking, instant token swaps, effortless devnet token purchases and much more.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    screenshots: [
      {
        src: '/screenshots/desktop-screenshot.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
      },
      {
        src: '/screenshots/mobile-screenshot.png',
        sizes: '1080x1920',
        type: 'image/png',
        form_factor: 'narrow',
      },
    ],
    icons: [
      {
        src: '/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['finance', 'utilities', 'productivity'],
  };
}
