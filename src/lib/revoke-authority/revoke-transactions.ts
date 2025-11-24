import { Transaction, PublicKey, Connection } from '@solana/web3.js';
import { createSetAuthorityInstruction, AuthorityType } from '@solana/spl-token';

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

  tx.add(
    createSetAuthorityInstruction(
      tokenMint,
      currentAuthority,
      AuthorityType.MetadataPointer,
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
