import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { connectionMainnet } from '@/service/solana/connection';
import type { WalletMigration, TokenMigration } from '@/types/types';

interface AssetResponse {
  id: string;
  interface: string;
  token_info?: {
    symbol?: string;
    decimals?: number;
    balance?: number;
  };
  content?: {
    metadata?: {
      symbol?: string;
      name?: string;
    };
  };
}

interface ApiResponse {
  result?: {
    items?: AssetResponse[];
  };
}

export function useWalletData() {
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [wallets, setWallets] = useState<WalletMigration[]>([]);
  const connection = connectionMainnet;

  const fetchWalletData = useCallback(async (address: string): Promise<WalletMigration | null> => {
    setLoading((prev) => new Set(prev).add(address));

    try {
      const RPC = connection.rpcEndpoint;
      const pubKey = new PublicKey(address);

      const solBalance = await connection.getBalance(pubKey);

      const response = await fetch(RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '1',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: address,
            page: 1,
            limit: 50,
            options: {
              showFungible: true,
              showNativeBalance: false,
              showZeroBalance: false,
            },
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch tokens');

      const data: ApiResponse = await response.json();
      const assets: AssetResponse[] = data.result?.items ?? [];

      const tokens: TokenMigration[] = assets
        .filter(
          (asset) => asset.interface === 'FungibleToken' || asset.interface === 'FungibleAsset',
        )
        .map((asset) => {
          const decimals = asset.token_info?.decimals ?? 0;
          const balance = asset.token_info?.balance ?? 0;
          return {
            mint: asset.id,
            symbol: asset.token_info?.symbol || asset.content?.metadata?.symbol || 'Unknown',
            name: asset.content?.metadata?.name || 'Unknown Token',
            decimals,
            balance,
            uiAmount: balance / Math.pow(10, decimals),
            selected: false,
          };
        });

      return {
        address,
        solBalance: solBalance / 1_000_000_000,
        tokens,
        selected: false,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Error fetching wallet data:', errMsg);
      return null;
    } finally {
      setLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(address);
        return newSet;
      });
    }
  }, []);

  const fetchMultipleWallets = useCallback(
    async (addresses: string[]): Promise<WalletMigration[]> => {
      const results = await Promise.allSettled(addresses.map(fetchWalletData));
      return results
        .filter(
          (r): r is PromiseFulfilledResult<WalletMigration> =>
            r.status === 'fulfilled' && r.value !== null,
        )
        .map((r) => r.value);
    },
    [fetchWalletData],
  );

  const refreshWallet = useCallback(
    async (address: string) => {
      const updated = await fetchWalletData(address);
      if (updated) {
        setWallets((prev) => prev.map((w) => (w.address === address ? updated : w)));
      }
      return updated;
    },
    [fetchWalletData],
  );

  const refreshAllWallets = useCallback(async () => {
    if (wallets.length === 0) return;
    const addresses = wallets.map((w) => w.address);
    const updated = await fetchMultipleWallets(addresses);
    setWallets(updated);
  }, [wallets, fetchMultipleWallets]);

  const clearWallets = useCallback(() => {
    setWallets([]);
  }, []);

  const addWallet = useCallback((wallet: WalletMigration) => {
    setWallets((prev) => {
      const existingIndex = prev.findIndex((w) => w.address === wallet.address);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = wallet;
        return updated;
      }
      return [...prev, wallet];
    });
  }, []);

  return {
    wallets,
    loading,
    fetchWalletData,
    fetchMultipleWallets,
    refreshWallet,
    refreshAllWallets,
    clearWallets,
    addWallet,
    setWallets,
  };
}
