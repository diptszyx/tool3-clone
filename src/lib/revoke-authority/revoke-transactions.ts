import {
  Transaction,
  PublicKey,
  Connection,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { createSetAuthorityInstruction, AuthorityType } from '@solana/spl-token';
import { createUpdateAuthorityInstruction as createMetadataUpdateAuthorityInstruction } from '@solana/spl-token-metadata';
import { isFeatureFreeServer } from '@/lib/invite-codes/check-server';

const FEE_AMOUNT = 0.002;
const FEE_LAMPORTS = FEE_AMOUNT * LAMPORTS_PER_SOL;

export interface RevokeAuthorityParams {
  tokenMint: PublicKey;
  currentAuthority: PublicKey;
  programId: PublicKey;
  connection: Connection;
  inviteCode?: string;
}

async function addFeeInstruction(
  tx: Transaction,
  payer: PublicKey,
  inviteCode?: string,
): Promise<void> {
  const hasInviteAccess = await isFeatureFreeServer('Revoke Authority', inviteCode);
  const ADMIN_PUBLIC_KEY = process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY;

  if (ADMIN_PUBLIC_KEY && !hasInviteAccess) {
    const adminPublicKey = new PublicKey(ADMIN_PUBLIC_KEY);
    console.log(`Charging revoke authority fee: ${FEE_AMOUNT} SOL to ${ADMIN_PUBLIC_KEY}`);

    tx.add(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: adminPublicKey,
        lamports: FEE_LAMPORTS,
      }),
    );
  } else {
    console.log('Free access activated - no fee charged');
  }
}

export async function createRevokeMintAuthorityTx({
  tokenMint,
  currentAuthority,
  programId,
  connection,
  inviteCode,
}: RevokeAuthorityParams): Promise<Transaction> {
  const tx = new Transaction();

  await addFeeInstruction(tx, currentAuthority, inviteCode);

  tx.add(
    createSetAuthorityInstruction(
      tokenMint,
      currentAuthority,
      AuthorityType.MintTokens,
      null,
      [],
      programId,
    ),
  );

  tx.feePayer = currentAuthority;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  console.log('Revoke Mint Authority transaction created');
  return tx;
}

export async function createRevokeFreezeAuthorityTx({
  tokenMint,
  currentAuthority,
  programId,
  connection,
  inviteCode,
}: RevokeAuthorityParams): Promise<Transaction> {
  const tx = new Transaction();

  await addFeeInstruction(tx, currentAuthority, inviteCode);

  tx.add(
    createSetAuthorityInstruction(
      tokenMint,
      currentAuthority,
      AuthorityType.FreezeAccount,
      null,
      [],
      programId,
    ),
  );

  tx.feePayer = currentAuthority;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  console.log('Revoke Freeze Authority transaction created');
  return tx;
}

export async function createRevokeUpdateAuthorityTx({
  tokenMint,
  currentAuthority,
  programId,
  connection,
  inviteCode,
}: RevokeAuthorityParams): Promise<Transaction> {
  const tx = new Transaction();

  await addFeeInstruction(tx, currentAuthority, inviteCode);

  try {
    const instruction = createMetadataUpdateAuthorityInstruction({
      metadata: tokenMint,
      oldAuthority: currentAuthority,
      newAuthority: null,
      programId,
    });

    tx.add(instruction);
  } catch (error) {
    console.error('Error creating revoke update authority transaction:', error);
    throw error;
  }

  tx.feePayer = currentAuthority;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  console.log('Revoke Update Authority transaction created');
  return tx;
}
