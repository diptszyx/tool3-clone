import { useState } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { toast } from 'sonner';
import { TokenInfo } from './use-token-info';
import { createMintTransaction } from '@/lib/mint-transaction';
import { getSavedInviteCode } from '@/lib/invite-codes/helpers';
import { useInviteFeature } from '@/hooks/use-invite-feature';
import { Connection } from '@solana/web3.js';

export const isValidAmount = (amount: string): boolean => {
  if (!amount || amount.trim() === '') return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
};

interface UseMintTokenParams {
  tokenAddress: string;
  tokenInfo: TokenInfo | null;
  publicKey: PublicKey | null;
  signTransaction: ((transaction: Transaction) => Promise<Transaction>) | undefined;
  connection: Connection;
  onSuccess?: () => void;
}

export const useMintToken = ({
  tokenAddress,
  tokenInfo,
  publicKey,
  signTransaction,
  connection,
  onSuccess,
}: UseMintTokenParams) => {
  const [isMinting, setIsMinting] = useState(false);

  const isFreeFeature = useInviteFeature('Mint Additional Supply');

  const mintTokens = async (mintAmount: string) => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet');
      return false;
    }

    if (!tokenInfo?.canMint) {
      toast.error('You do not have mint authority');
      return false;
    }

    if (!isValidAmount(mintAmount)) {
      toast.error('Please enter a valid amount (must be a positive number)');
      return false;
    }

    const numAmount = parseFloat(mintAmount);

    if (numAmount > Number.MAX_SAFE_INTEGER / Math.pow(10, tokenInfo.decimals)) {
      toast.error('Amount is too large');
      return false;
    }

    setIsMinting(true);

    try {
      const saved = getSavedInviteCode();
      const inviteCode = saved?.code;

      const transaction = await createMintTransaction({
        tokenAddress,
        publicKey,
        mintAmount: numAmount,
        decimals: tokenInfo.decimals,
        isToken2022: tokenInfo.isToken2022,
        inviteCode,
        connection,
      });

      transaction.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      const signed = await signTransaction(transaction);

      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      if (onSuccess) {
        onSuccess();
      }

      await connection.confirmTransaction(signature, 'confirmed');

      toast.success('Mint token successful', {
        description: `You have minted ${numAmount.toLocaleString()} ${tokenInfo.metadata?.symbol || 'tokens'}`,
        action: {
          label: 'View Transaction',
          onClick: () =>
            window.open(
              `https://orb.helius.dev/tx/${signature}?cluster=mainnet-beta&tab=summary`,
              '_blank',
            ),
        },
      });

      return true;
    } catch (error: unknown) {
      console.error('Mint error:', error);

      if (error instanceof Error) {
        toast.error(`Mint failed: ${error.message}`);
      } else {
        toast.error('Mint failed');
      }

      return false;
    } finally {
      setIsMinting(false);
    }
  };

  return {
    mintTokens,
    isMinting,
    isFreeFeature,
  };
};
