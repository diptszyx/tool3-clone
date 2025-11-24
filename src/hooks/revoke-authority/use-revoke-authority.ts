import { useState } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';
import { toast } from 'sonner';
import {
  createRevokeMintAuthorityTx,
  createRevokeFreezeAuthorityTx,
  createRevokeUpdateAuthorityTx,
} from '@/lib/revoke-authority/revoke-transactions';

interface UseRevokeAuthorityParams {
  tokenAddress: string;
  publicKey: PublicKey | null;
  signTransaction: ((transaction: Transaction) => Promise<Transaction>) | undefined;
  connection: Connection;
  programId: PublicKey | undefined;
  onSuccess?: () => void;
}

export function useRevokeAuthority({
  tokenAddress,
  publicKey,
  signTransaction,
  connection,
  programId,
  onSuccess,
}: UseRevokeAuthorityParams) {
  const [isRevoking, setIsRevoking] = useState(false);

  const revokeMintAuthority = async () => {
    if (!publicKey || !signTransaction || !programId) {
      toast.error('Please connect your wallet');
      return false;
    }

    setIsRevoking(true);

    try {
      const mintPubkey = new PublicKey(tokenAddress);

      const transaction = await createRevokeMintAuthorityTx({
        tokenMint: mintPubkey,
        currentAuthority: publicKey,
        programId,
        connection,
      });

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await connection.confirmTransaction(signature, 'confirmed');

      toast.success(' Mint authority revoked successfully!', {
        description: 'This token can no longer mint new supply',
        action: {
          label: 'View Transaction',
          onClick: () =>
            window.open(
              `https://orb.helius.dev/tx/${signature}?cluster=mainnet-beta&tab=summary`,
              '_blank',
            ),
        },
      });

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error: unknown) {
      console.error('Revoke mint authority error:', error);

      if (error instanceof Error) {
        toast.error(`Failed to revoke mint authority: ${error.message}`);
      } else {
        toast.error('Failed to revoke mint authority');
      }

      return false;
    } finally {
      setIsRevoking(false);
    }
  };

  const revokeFreezeAuthority = async () => {
    if (!publicKey || !signTransaction || !programId) {
      toast.error('Please connect your wallet');
      return false;
    }

    setIsRevoking(true);

    try {
      const mintPubkey = new PublicKey(tokenAddress);

      const transaction = await createRevokeFreezeAuthorityTx({
        tokenMint: mintPubkey,
        currentAuthority: publicKey,
        programId,
        connection,
      });

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await connection.confirmTransaction(signature, 'confirmed');

      toast.success('Freeze authority revoked successfully!', {
        description: 'This token can no longer freeze accounts',
        action: {
          label: 'View Transaction',
          onClick: () =>
            window.open(
              `https://orb.helius.dev/tx/${signature}?cluster=mainnet-beta&tab=summary`,
              '_blank',
            ),
        },
      });

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error: unknown) {
      console.error('Revoke freeze authority error:', error);

      if (error instanceof Error) {
        toast.error(`Failed to revoke freeze authority: ${error.message}`);
      } else {
        toast.error('Failed to revoke freeze authority');
      }

      return false;
    } finally {
      setIsRevoking(false);
    }
  };

  const revokeUpdateAuthority = async () => {
    if (!publicKey || !signTransaction || !programId) {
      toast.error('Please connect your wallet');
      return false;
    }

    setIsRevoking(true);

    try {
      const mintPubkey = new PublicKey(tokenAddress);

      const transaction = await createRevokeUpdateAuthorityTx({
        tokenMint: mintPubkey,
        currentAuthority: publicKey,
        programId,
        connection,
      });

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await connection.confirmTransaction(signature, 'confirmed');

      toast.success('Update authority revoked successfully!', {
        description: 'Token metadata can no longer be updated',
        action: {
          label: 'View Transaction',
          onClick: () =>
            window.open(
              `https://orb.helius.dev/tx/${signature}?cluster=mainnet-beta&tab=summary`,
              '_blank',
            ),
        },
      });

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error: unknown) {
      console.error('Revoke update authority error:', error);

      if (error instanceof Error) {
        toast.error(`Failed to revoke update authority: ${error.message}`);
      } else {
        toast.error('Failed to revoke update authority');
      }

      return false;
    } finally {
      setIsRevoking(false);
    }
  };

  return {
    revokeMintAuthority,
    revokeFreezeAuthority,
    revokeUpdateAuthority,
    isRevoking,
  };
}
