import { Transaction, PublicKey, Connection } from '@solana/web3.js';
import { createSetAuthorityInstruction, AuthorityType } from '@solana/spl-token';
import { createUpdateAuthorityInstruction as createMetadataUpdateAuthorityInstruction } from '@solana/spl-token-metadata';

export interface RevokeAuthorityParams {
  tokenMint: PublicKey;
  currentAuthority: PublicKey;
  programId: PublicKey;
  connection: Connection;
}

export async function createRevokeMintAuthorityTx({
  tokenMint,
  currentAuthority,
  programId,
  connection,
}: RevokeAuthorityParams): Promise<Transaction> {
  const tx = new Transaction();

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

  return tx;
}

export async function createRevokeFreezeAuthorityTx({
  tokenMint,
  currentAuthority,
  programId,
  connection,
}: RevokeAuthorityParams): Promise<Transaction> {
  const tx = new Transaction();

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

  return tx;
}

export async function createRevokeUpdateAuthorityTx({
  tokenMint,
  currentAuthority,
  programId,
  connection,
}: RevokeAuthorityParams): Promise<Transaction> {
  const tx = new Transaction();

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

  return tx;
}
