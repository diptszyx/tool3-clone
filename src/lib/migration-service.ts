import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import type { WalletMigration } from '@/types/types';
import { connectionMainnet } from '@/service/solana/connection';
import { isFeatureFreeServer } from '@/lib/invite-codes/check-server';

interface MigrationParams {
  wallet: WalletMigration;
  destinationAddress: string;
  includeSol: boolean;
  inviteCode?: string;
}

interface MigrationResult {
  success: boolean;
  tokensTransferred: number;
  error?: string;
  signature?: string;
}

const MAX_INSTRUCTIONS_PER_TX = 20;
const COMPUTE_UNIT_LIMIT_BASE = 400000;
const COMPUTE_UNIT_LIMIT_PER_TOKEN = 50000;
const ADMIN_PUBLIC_KEY = process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY;
const MIGRATION_FEE_PER_WALLET = 0.001 * LAMPORTS_PER_SOL;

export async function executeSingleWalletMigration({
  wallet,
  destinationAddress,
  includeSol,
  inviteCode,
}: MigrationParams): Promise<MigrationResult> {
  try {
    const connection = connectionMainnet;
    const selectedTokens = wallet.tokens.filter((t) => t.selected);

    if (selectedTokens.length === 0 && !includeSol) {
      return { success: false, tokensTransferred: 0, error: 'No tokens selected for migration' };
    }

    const estimatedInstructions = selectedTokens.length * 2 + (includeSol ? 1 : 0) + 2 + 1;

    if (estimatedInstructions > MAX_INSTRUCTIONS_PER_TX) {
      return {
        success: false,
        tokensTransferred: 0,
        error: `Too many tokens selected (${selectedTokens.length}). Please select maximum ${Math.floor(
          MAX_INSTRUCTIONS_PER_TX / 2,
        )} tokens per transaction.`,
      };
    }

    const destinationPubkey = new PublicKey(destinationAddress);
    const sourcePubkey = new PublicKey(wallet.address);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window === 'undefined' || !(window as any).solana) {
      return { success: false, tokensTransferred: 0, error: 'Wallet not connected' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walletAdapter = (window as any).solana;

    const instructions = [];

    const computeUnits =
      COMPUTE_UNIT_LIMIT_BASE + selectedTokens.length * COMPUTE_UNIT_LIMIT_PER_TOKEN;
    instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }));
    instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10000 }));

    let tokensProcessed = 0;

    for (const token of selectedTokens) {
      try {
        const mintPubkey = new PublicKey(token.mint);
        const sourceTokenAccount = await getAssociatedTokenAddress(
          mintPubkey,
          sourcePubkey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );
        const destinationTokenAccount = await getAssociatedTokenAddress(
          mintPubkey,
          destinationPubkey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let destinationAccountExists = true;
        try {
          await getAccount(connection, destinationTokenAccount, 'confirmed');
        } catch {
          destinationAccountExists = false;
        }

        if (!destinationAccountExists) {
          instructions.push(
            createAssociatedTokenAccountInstruction(
              sourcePubkey,
              destinationTokenAccount,
              destinationPubkey,
              mintPubkey,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID,
            ),
          );
        }

        const rawAmount = Math.floor(token.uiAmount * Math.pow(10, token.decimals));
        if (rawAmount > 0) {
          instructions.push(
            createTransferInstruction(
              sourceTokenAccount,
              destinationTokenAccount,
              sourcePubkey,
              rawAmount,
              [],
              TOKEN_PROGRAM_ID,
            ),
          );
          tokensProcessed++;
        }
      } catch (innerError) {
        console.error(`Error preparing transfer for token ${token.symbol}:`, innerError);
      }
    }

    if (includeSol && wallet.solBalance > 0) {
      const rentReserve = 0.01;
      const transferAmount = Math.max(0, wallet.solBalance - rentReserve);

      if (transferAmount > 0) {
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: sourcePubkey,
            toPubkey: destinationPubkey,
            lamports: Math.floor(transferAmount * 1e9),
          }),
        );
      }
    }

    const hasInviteAccess = await isFeatureFreeServer('Wallet Asset Migration', inviteCode);

    if (ADMIN_PUBLIC_KEY && !hasInviteAccess) {
      try {
        const adminPubkey = new PublicKey(ADMIN_PUBLIC_KEY);
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: sourcePubkey,
            toPubkey: adminPubkey,
            lamports: MIGRATION_FEE_PER_WALLET,
          }),
        );
        console.log(`Added migration fee: 0.001 SOL to admin wallet`);
      } catch (error) {
        console.warn('Invalid admin public key, skipping fee:', error);
      }
    }

    if (instructions.length <= 2) {
      return { success: false, tokensTransferred: 0, error: 'No valid transfers to execute' };
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

    const messageV0 = new TransactionMessage({
      payerKey: sourcePubkey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    const simulation = await connection.simulateTransaction(transaction, { sigVerify: false });
    if (simulation.value.err) {
      console.error('Simulation error:', simulation.value.err);
      console.error('Logs:', simulation.value.logs);
      return {
        success: false,
        tokensTransferred: 0,
        error: `Simulation failed: ${JSON.stringify(simulation.value.err)}`,
      };
    }

    const signedTransaction = await walletAdapter.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 5,
    });

    const confirmation = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed',
    );

    if (confirmation.value.err) {
      console.error('Transaction failed:', confirmation.value.err);
      return {
        success: false,
        tokensTransferred: 0,
        error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
      };
    }

    return {
      success: true,
      tokensTransferred: tokensProcessed,
      signature,
    };
  } catch (error) {
    console.error('Migration error:', error);

    const message =
      error instanceof Error
        ? error.message.includes('User rejected')
          ? 'Transaction was rejected by user'
          : error.message.includes('insufficient funds')
            ? 'Insufficient SOL for transaction fees'
            : error.message.includes('Blockhash not found')
              ? 'Transaction expired, please try again'
              : error.message.includes('block height exceeded')
                ? 'Transaction timed out, please try again'
                : error.message
        : 'Unknown error occurred';

    return { success: false, tokensTransferred: 0, error: message };
  }
}
