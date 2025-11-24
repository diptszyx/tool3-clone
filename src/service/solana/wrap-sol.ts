import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { connectionDevnet } from './connection';

export interface WrapResult {
  signature: string;
  wsolAddress: string;
}

export async function wrapSol(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  amountInSol: number,
): Promise<WrapResult> {
  const wsolAccount = await getAssociatedTokenAddress(NATIVE_MINT, walletPublicKey);

  let accountExists = true;
  try {
    await getAccount(connectionDevnet, wsolAccount);
  } catch {
    accountExists = false;
  }

  const lamports = Math.floor(amountInSol * LAMPORTS_PER_SOL);
  const tx = new Transaction();

  if (!accountExists) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        walletPublicKey,
        wsolAccount,
        walletPublicKey,
        NATIVE_MINT,
      ),
    );
  }

  tx.add(
    SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey: wsolAccount,
      lamports,
    }),
  );

  // Sync native để chuyển SOL thành WSOL token
  tx.add(createSyncNativeInstruction(wsolAccount));

  // Sign và send
  tx.feePayer = walletPublicKey;
  tx.recentBlockhash = (await connectionDevnet.getLatestBlockhash()).blockhash;

  const signed = await signTransaction(tx);
  const signature = await connectionDevnet.sendRawTransaction(signed.serialize());
  await connectionDevnet.confirmTransaction(signature, 'confirmed');

  return {
    signature,
    wsolAddress: wsolAccount.toBase58(),
  };
}

/**
 * Unwrap WSOL thành SOL
 */
export async function unwrapSol(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
): Promise<string> {
  // Lấy WSOL account
  const wsolAccount = await getAssociatedTokenAddress(NATIVE_MINT, walletPublicKey);

  // Check xem account có tồn tại không
  try {
    await getAccount(connectionDevnet, wsolAccount);
  } catch {
    throw new Error('Bạn không có Wrapped SOL để unwrap');
  }

  const tx = new Transaction();

  // Close account để lấy lại SOL
  tx.add(
    createCloseAccountInstruction(
      wsolAccount,
      walletPublicKey, // destination (nhận SOL)
      walletPublicKey, // owner
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  // Sign và send
  tx.feePayer = walletPublicKey;
  tx.recentBlockhash = (await connectionDevnet.getLatestBlockhash()).blockhash;

  const signed = await signTransaction(tx);
  const signature = await connectionDevnet.sendRawTransaction(signed.serialize());
  await connectionDevnet.confirmTransaction(signature, 'confirmed');

  return signature;
}

export async function getWsolBalance(walletPublicKey: PublicKey): Promise<number> {
  try {
    const wsolAccount = await getAssociatedTokenAddress(NATIVE_MINT, walletPublicKey);

    const accountInfo = await getAccount(connectionDevnet, wsolAccount);
    return Number(accountInfo.amount) / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}
