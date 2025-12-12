'use client';

import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import { ReactNode, useMemo, useEffect } from 'react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

import { useNetwork } from '@/context/NetworkContext';
import { initializeMobileWalletAdapter } from '@/lib/mobile-wallet-adapter';

export default function WalletProviderComponent({ children }: { children: ReactNode }) {
  const { network } = useNetwork();

  useEffect(() => {
    initializeMobileWalletAdapter();
  }, []);

  const endpoint = useMemo(() => {
    if (network === 'devnet') {
      return process.env.NEXT_PUBLIC_RPC_DEVNET || clusterApiUrl('devnet');
    } else {
      return process.env.NEXT_PUBLIC_RPC_MAINNET || clusterApiUrl('mainnet-beta');
    }
  }, [network]);

  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
