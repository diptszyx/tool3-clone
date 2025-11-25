import { useState, useCallback } from 'react';
import {
  fetchTokenMetadata,
  isValidTokenAddress,
  TokenMetadata,
} from '@/lib/clone-token/fetch-token-metadata';
import { Connection } from '@solana/web3.js';

interface UseCloneTokenInfoResult {
  tokenInfo: TokenMetadata | null;
  isLoading: boolean;
  error: string | null;
  fetchInfo: (address: string) => Promise<void>;
  reset: () => void;
}

export function useCloneTokenInfo(connection: Connection): UseCloneTokenInfoResult {
  const [tokenInfo, setTokenInfo] = useState<TokenMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(
    async (address: string) => {
      setError(null);
      setTokenInfo(null);

      if (!isValidTokenAddress(address)) {
        setError('Invalid token address');
        return;
      }

      setIsLoading(true);

      try {
        const metadata = await fetchTokenMetadata(connection, address);
        setTokenInfo(metadata);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token info';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [connection],
  );

  const reset = useCallback(() => {
    setTokenInfo(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    tokenInfo,
    isLoading,
    error,
    fetchInfo,
    reset,
  };
}
