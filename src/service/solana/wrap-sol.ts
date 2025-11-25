import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
  getAccount,
} from '@solana/spl-token';

export interface WrapResult {
  signature: string;
  wsolAddress: string;
}

export async function wrapSol(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  amountInSol: number,
  connection: Connection,
): Promise<WrapResult> {
  const wsolAccount = await getAssociatedTokenAddress(NATIVE_MINT, walletPublicKey);

  let accountExists = true;
  try {
    await getAccount(connection, wsolAccount);
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

  tx.add(createSyncNativeInstruction(wsolAccount));

  tx.feePayer = walletPublicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signed = await signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(signature, 'confirmed');

  return {
    signature,
    wsolAddress: wsolAccount.toBase58(),
  };
}

export async function unwrapSol(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  connection: Connection,
): Promise<string> {
  const wsolAccount = await getAssociatedTokenAddress(NATIVE_MINT, walletPublicKey);

  try {
    await getAccount(connection, wsolAccount);
  } catch {
    throw new Error('You have no Wrapped SOL to unwrap');
  }

  const tx = new Transaction();

  tx.add(
    createCloseAccountInstruction(
      wsolAccount,
      walletPublicKey,
      walletPublicKey,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  tx.feePayer = walletPublicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signed = await signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}

export async function getWsolBalance(
  walletPublicKey: PublicKey,
  connection: Connection,
): Promise<number> {
  try {
    const wsolAccount = await getAssociatedTokenAddress(NATIVE_MINT, walletPublicKey);

    const accountInfo = await getAccount(connection, wsolAccount);
    return Number(accountInfo.amount) / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}
