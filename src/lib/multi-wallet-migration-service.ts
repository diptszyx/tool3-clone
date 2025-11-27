import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  ComputeBudgetProgram,
  Keypair,
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
import bs58 from 'bs58';
import { isFeatureFreeServer } from '@/lib/invite-codes/check-server';

interface MultiWalletMigrationParams {
  wallets: WalletMigration[];
  destinationAddress: string;
  includeSol: boolean;
  privateKeys: Record<string, string>;
  inviteCode?: string;
  onProgress?: (current: number, total: number, status: string) => void;
}

interface MultiWalletMigrationResult {
  success: boolean;
  totalWallets: number;
  successfulWallets: number;
  failedWallets: number;
  signatures: string[];
  errors: Array<{ wallet: string; error: string }>;
}

const MAX_INSTRUCTIONS_PER_TX = 20;
const ADMIN_PUBLIC_KEY = process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY;
const MIGRATION_FEE_PER_WALLET = 0.002 * LAMPORTS_PER_SOL;

export async function executeMultiWalletMigration({
  wallets,
  destinationAddress,
  includeSol,
  privateKeys,
  inviteCode,
  onProgress,
}: MultiWalletMigrationParams): Promise<MultiWalletMigrationResult> {
  const connection = connectionMainnet;
  const destinationPubkey = new PublicKey(destinationAddress);

  const selectedWallets = wallets.filter((w) => w.selected);
  const results: MultiWalletMigrationResult = {
    success: true,
    totalWallets: selectedWallets.length,
    successfulWallets: 0,
    failedWallets: 0,
    signatures: [],
    errors: [],
  };

  for (let i = 0; i < selectedWallets.length; i++) {
    const wallet = selectedWallets[i];
    const privateKey = privateKeys[wallet.address];

    if (!privateKey) {
      results.errors.push({
        wallet: wallet.address,
        error: 'Private key not found',
      });
      results.failedWallets++;
      continue;
    }

    onProgress?.(
      i + 1,
      selectedWallets.length,
      `Processing wallet ${i + 1}/${selectedWallets.length}`,
    );

    try {
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
      const sourcePubkey = keypair.publicKey;

      if (sourcePubkey.toBase58() !== wallet.address) {
        throw new Error('Private key does not match wallet address');
      }

      const selectedTokens = wallet.tokens.filter((t) => t.selected);

      if (selectedTokens.length === 0 && (!includeSol || wallet.solBalance === 0)) {
        continue;
      }

      const estimatedInstructions = selectedTokens.length * 2 + (includeSol ? 1 : 0) + 2 + 1;

      if (estimatedInstructions > MAX_INSTRUCTIONS_PER_TX) {
        throw new Error(
          `Too many instructions (${estimatedInstructions}). Max ${MAX_INSTRUCTIONS_PER_TX}`,
        );
      }

      const instructions = [];

      const computeUnits = 400000 + selectedTokens.length * 50000;
      instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }));
      instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10000 }));

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

          let destinationAccountExists = false;
          try {
            await getAccount(connection, destinationTokenAccount, 'confirmed');
            destinationAccountExists = true;
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
          }
        } catch (error) {
          console.error(`Error preparing token ${token.symbol}:`, error);
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
          console.log(`Added migration fee: 0.002 SOL for wallet ${wallet.address}`);
        } catch (error) {
          console.warn('Invalid admin public key, skipping fee:', error);
        }
      } else {
        console.log(`No fee for wallet ${wallet.address} (free access or whitelisted)`);
      }

      if (instructions.length <= 2) {
        continue;
      }

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

      const messageV0 = new TransactionMessage({
        payerKey: sourcePubkey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);
      transaction.sign([keypair]);

      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 5,
      });

      const confirmation = await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed',
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      results.signatures.push(signature);
      results.successfulWallets++;
    } catch (error) {
      console.error(`Error migrating wallet ${wallet.address}:`, error);
      results.errors.push({
        wallet: wallet.address,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      results.failedWallets++;
    }
  }

  results.success = results.failedWallets === 0;
  return results;
}
