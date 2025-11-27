import { useState } from 'react';
import { PublicKey, Transaction, Connection } from '@solana/web3.js';
import {
  createRevokeMintAuthorityTx,
  createRevokeFreezeAuthorityTx,
  createRevokeUpdateAuthorityTx,
} from '@/lib/revoke-authority/revoke-transactions';
import { getSavedInviteCode } from '@/lib/invite-codes/helpers';

interface UseRevokeAuthorityParams {
  tokenAddress: string;
  publicKey: PublicKey | null;
  signTransaction: ((transaction: Transaction) => Promise<Transaction>) | undefined;
  connection: Connection;
  programId: PublicKey | undefined;
}

export interface RevokeResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export function useRevokeAuthority({
  tokenAddress,
  publicKey,
  signTransaction,
  connection,
  programId,
}: UseRevokeAuthorityParams) {
  const [isRevoking, setIsRevoking] = useState(false);

  const revokeMintAuthority = async (): Promise<RevokeResult> => {
    if (!publicKey || !signTransaction || !programId) {
      return { success: false, error: 'Please connect your wallet' };
    }

    setIsRevoking(true);

    try {
      const mintPubkey = new PublicKey(tokenAddress);

      const saved = getSavedInviteCode();
      const inviteCode = saved?.code;

      const transaction = await createRevokeMintAuthorityTx({
        tokenMint: mintPubkey,
        currentAuthority: publicKey,
        programId,
        connection,
        inviteCode,
      });

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await connection.confirmTransaction(signature, 'confirmed');

      return { success: true, signature };
    } catch (error: unknown) {
      console.error('Revoke mint authority error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    } finally {
      setIsRevoking(false);
    }
  };

  const revokeFreezeAuthority = async (): Promise<RevokeResult> => {
    if (!publicKey || !signTransaction || !programId) {
      return { success: false, error: 'Please connect your wallet' };
    }

    setIsRevoking(true);

    try {
      const mintPubkey = new PublicKey(tokenAddress);

      const saved = getSavedInviteCode();
      const inviteCode = saved?.code;

      const transaction = await createRevokeFreezeAuthorityTx({
        tokenMint: mintPubkey,
        currentAuthority: publicKey,
        programId,
        connection,
        inviteCode,
      });

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await connection.confirmTransaction(signature, 'confirmed');

      return { success: true, signature };
    } catch (error: unknown) {
      console.error('Revoke freeze authority error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    } finally {
      setIsRevoking(false);
    }
  };

  const revokeUpdateAuthority = async (): Promise<RevokeResult> => {
    if (!publicKey || !signTransaction || !programId) {
      return { success: false, error: 'Please connect your wallet' };
    }

    setIsRevoking(true);

    try {
      const mintPubkey = new PublicKey(tokenAddress);

      const saved = getSavedInviteCode();
      const inviteCode = saved?.code;

      const transaction = await createRevokeUpdateAuthorityTx({
        tokenMint: mintPubkey,
        currentAuthority: publicKey,
        programId,
        connection,
        inviteCode,
      });

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await connection.confirmTransaction(signature, 'confirmed');

      return { success: true, signature };
    } catch (error: unknown) {
      console.error('Revoke update authority error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
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
