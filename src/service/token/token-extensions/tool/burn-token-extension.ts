import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { isFeatureFreeServer } from '@/lib/invite-codes/check-server';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  createBurnCheckedInstruction,
  getAccount,
} from '@solana/spl-token';

export interface TokenBurnParams {
  mintAddress: string;
  amount: string | number;
  decimals: number;
}

export interface TokenBurnResult {
  signature: string;
  mintAddress: string;
  amount: string | number;
}

export interface TokenBurnOptions {
  mintAddress: string;
  amount: string | number;
  decimals: number;
  inviteCode?: string;
}

export interface TokenBurnCallbacks {
  onStart?: () => void;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
  onFinish?: () => void;
}

export async function burnToken(
  connection: Connection,
  wallet: WalletContextState,
  options: TokenBurnOptions,
  callbacks?: TokenBurnCallbacks,
): Promise<TokenBurnResult> {
  const { mintAddress, amount, decimals } = options;
  const { onStart, onSuccess, onError, onFinish } = callbacks || {};

  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    if (onStart) onStart();

    const mintPublicKey = new PublicKey(mintAddress);

    const amountValue = typeof amount === 'string' ? parseFloat(amount) : amount;
    const burnAmount = BigInt(Math.floor(amountValue * Math.pow(10, decimals)));
    if (burnAmount <= BigInt(0)) {
      throw new Error('Invalid token amount');
    }

    const mintInfo = await connection.getAccountInfo(mintPublicKey);
    if (!mintInfo) {
      throw new Error('Token mint not found');
    }

    let programId: PublicKey;
    if (mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      programId = TOKEN_2022_PROGRAM_ID;
    } else if (mintInfo.owner.equals(TOKEN_PROGRAM_ID)) {
      programId = TOKEN_PROGRAM_ID;
    } else {
      throw new Error(`Unknown token program: ${mintInfo.owner.toString()}`);
    }

    const tokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      wallet.publicKey,
      false,
      programId,
    );

    const tokenAccountInfo = await getAccount(connection, tokenAccount, 'confirmed', programId);

    if (tokenAccountInfo.isFrozen) {
      throw new Error('Token account is frozen');
    }

    if (tokenAccountInfo.amount < burnAmount) {
      throw new Error('Insufficient token balance');
    }

    const solBalance = (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL;
    if (solBalance < 0.003) {
      throw new Error('Insufficient SOL for fees');
    }

    const transaction = new Transaction();

    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000,
      }),
    );

    const hasInviteAccess = await isFeatureFreeServer('Burn Token', options.inviteCode);
    const ADMIN_PUBLIC_KEY = process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY;

    if (ADMIN_PUBLIC_KEY && !hasInviteAccess) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(ADMIN_PUBLIC_KEY),
          lamports: 0.002 * LAMPORTS_PER_SOL,
        }),
      );
    }

    const burnInstruction = createBurnCheckedInstruction(
      tokenAccount,
      mintPublicKey,
      wallet.publicKey,
      burnAmount,
      decimals,
      [],
      programId,
    );

    transaction.add(burnInstruction);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    if (!wallet.signTransaction) {
      throw new Error('Wallet does not support transaction signing');
    }

    const signedTx = await wallet.signTransaction(transaction);
    const serialized = signedTx.serialize();

    if (serialized.length > 1232) {
      throw new Error('Transaction too large');
    }

    const signature = await connection.sendRawTransaction(serialized, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3,
    });

    const confirmation = await connection.confirmTransaction(
      {
        blockhash,
        lastValidBlockHeight,
        signature,
      },
      'confirmed',
    );

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    if (onSuccess) onSuccess(signature);

    return {
      signature,
      mintAddress,
      amount,
    };
  } catch (error: unknown) {
    if (onError) {
      if (error instanceof Error) {
        onError(error);
      } else {
        onError(new Error(String(error)));
      }
    }
    throw error;
  } finally {
    if (onFinish) onFinish();
  }
}
