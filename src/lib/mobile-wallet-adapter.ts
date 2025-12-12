'use client';

import {
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
  registerMwa,
} from '@solana-mobile/wallet-standard-mobile';

export function initializeMobileWalletAdapter() {
  if (typeof window === 'undefined') return;

  registerMwa({
    appIdentity: {
      name: 'Tool3',
      uri: 'https://tool3-clone-afk5.vercel.app/',
      icon: '/icon-192x192.png',
    },
    authorizationCache: createDefaultAuthorizationCache(),
    chains: ['solana:devnet', 'solana:mainnet'],
    chainSelector: createDefaultChainSelector(),
    onWalletNotFound: createDefaultWalletNotFoundHandler(),
    // remoteHostAuthority: process.env.NEXT_PUBLIC_MWA_REFLECTOR_URL,
  });
}
