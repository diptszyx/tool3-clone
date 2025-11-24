import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  Connection,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
} from '@solana/spl-token';
import { isFeatureFreeServer } from '@/lib/invite-codes/check-server';

const FEE_AMOUNT = 0.001;
const FEE_LAMPORTS = FEE_AMOUNT * LAMPORTS_PER_SOL;

export interface MintTransactionParams {
  tokenAddress: string;
  publicKey: PublicKey;
  mintAmount: number;
  decimals: number;
  isToken2022: boolean;
  inviteCode?: string;
  connection: Connection;
}

export async function createMintTransaction(params: MintTransactionParams): Promise<Transaction> {
  const { tokenAddress, publicKey, mintAmount, decimals, isToken2022, inviteCode, connection } =
    params;

  const mintPubkey = new PublicKey(tokenAddress);
  const programId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

  const userTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    publicKey,
    false,
    programId,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  let accountExists = false;
  try {
    const accountInfo = await getAccount(connection, userTokenAccount, 'confirmed', programId);
    accountExists = accountInfo && accountInfo.mint.equals(mintPubkey);
  } catch {
    accountExists = false;
  }

  const tx = new Transaction();

  const hasInviteAccess = await isFeatureFreeServer('Mint Additional Supply', inviteCode);
  const ADMIN_PUBLIC_KEY = process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY;

  if (ADMIN_PUBLIC_KEY && !hasInviteAccess) {
    const adminPublicKey = new PublicKey(ADMIN_PUBLIC_KEY);
    tx.add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: adminPublicKey,
        lamports: FEE_LAMPORTS,
      }),
    );
  }

  if (!accountExists) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        publicKey,
        userTokenAccount,
        publicKey,
        mintPubkey,
        programId,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  const amount = BigInt(Math.floor(mintAmount * Math.pow(10, decimals)));

  tx.add(createMintToInstruction(mintPubkey, userTokenAccount, publicKey, amount, [], programId));

  return tx;
}

export { FEE_AMOUNT };
