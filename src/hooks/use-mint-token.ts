import { useState } from 'react';
import { PublicKey, Transaction, Connection } from '@solana/web3.js';
import { TokenInfo } from './use-token-info';
import { createMintTransaction } from '@/lib/mint-transaction';
import { getSavedInviteCode } from '@/lib/invite-codes/helpers';
import { useInviteFeature } from '@/hooks/use-invite-feature';

export const isValidAmount = (amount: string): boolean => {
  if (!amount || amount.trim() === '') return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
};

interface UseMintTokenParams {
  tokenAddress: string;
  tokenInfo: TokenInfo | null;
  publicKey: PublicKey | null;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
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
      return { ok: false, error: 'WALLET_NOT_CONNECTED' };
    }

    if (!tokenInfo?.canMint) {
      return { ok: false, error: 'NO_MINT_AUTHORITY' };
    }

    if (!isValidAmount(mintAmount)) {
      return { ok: false, error: 'INVALID_AMOUNT' };
    }

    const numAmount = parseFloat(mintAmount);
    if (numAmount > Number.MAX_SAFE_INTEGER / Math.pow(10, tokenInfo.decimals)) {
      return { ok: false, error: 'AMOUNT_TOO_LARGE' };
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

      await connection.confirmTransaction(signature, 'confirmed');

      if (onSuccess) onSuccess();

      return { ok: true, signature };
    } catch {
      return { ok: false, error: 'MINT_FAILED' };
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
