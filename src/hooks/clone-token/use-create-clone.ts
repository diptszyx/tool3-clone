import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { buildCloneTransaction } from '@/lib/clone-token/create-clone-transaction';
import { TokenMetadata } from '@/lib/clone-token/fetch-token-metadata';
import { Connection } from '@solana/web3.js';
import { getSavedInviteCode } from '@/lib/invite-codes/helpers';
import { useInviteFeature } from '@/hooks/use-invite-feature';

interface UseCreateCloneResult {
  isCreating: boolean;
  error: string | null;
  result: { mintAddress: string; signature: string } | null;
  createClone: (tokenInfo: TokenMetadata) => Promise<void>;
  reset: () => void;
  isFreeFeature: boolean;
}

export function useCreateClone(connection: Connection): UseCreateCloneResult {
  const { publicKey, sendTransaction } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ mintAddress: string; signature: string } | null>(null);

  const isFreeFeature = useInviteFeature('Clone Token');

  const createClone = useCallback(
    async (tokenInfo: TokenMetadata) => {
      if (!publicKey) {
        setError('WALLET_NOT_CONNECTED');
        return;
      }

      if (!sendTransaction) {
        setError('WALLET_NOT_SUPPORTED');
        return;
      }

      setError(null);
      setResult(null);
      setIsCreating(true);

      try {
        const saved = getSavedInviteCode();
        const inviteCode = saved?.code;

        const { transaction, mintKeypair } = await buildCloneTransaction({
          connection,
          payer: publicKey,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          uri: tokenInfo.uri,
          decimals: tokenInfo.decimals,
          supply: 1000000,
          inviteCode,
          programId: tokenInfo.programId,
        });

        transaction.feePayer = publicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        const signature = await sendTransaction(transaction, connection, {
          signers: [mintKeypair],
        });

        const latest = await connection.getLatestBlockhash();

        await connection.confirmTransaction(
          {
            signature,
            blockhash: latest.blockhash,
            lastValidBlockHeight: latest.lastValidBlockHeight,
          },
          'confirmed',
        );

        setResult({
          mintAddress: mintKeypair.publicKey.toBase58(),
          signature,
        });
      } catch {
        setError('CLONE_FAILED');
      } finally {
        setIsCreating(false);
      }
    },
    [connection, publicKey, sendTransaction],
  );

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    setIsCreating(false);
  }, []);

  return {
    isCreating,
    error,
    result,
    createClone,
    reset,
    isFreeFeature,
  };
}
