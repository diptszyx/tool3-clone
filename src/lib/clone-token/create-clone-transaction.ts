import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
} from '@solana/spl-token';
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import { isFeatureFreeServer } from '@/lib/invite-codes/check-server';

const FEE_AMOUNT = 0.001;
const FEE_LAMPORTS = FEE_AMOUNT * LAMPORTS_PER_SOL;

export interface BuildCloneTransactionParams {
  connection: Connection;
  payer: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  supply?: number;
  inviteCode?: string;
  programId: PublicKey;
}

export interface BuildCloneTransactionResult {
  transaction: Transaction;
  mintKeypair: Keypair;
}

export async function buildCloneTransaction(
  params: BuildCloneTransactionParams,
): Promise<BuildCloneTransactionResult> {
  const {
    connection,
    payer,
    name,
    symbol,
    uri,
    decimals,
    supply = 1_000_000,
    inviteCode,
    programId,
  } = params;

  try {
    const mintKeypair = Keypair.generate();
    const mintPubkey = mintKeypair.publicKey;

    const lamports = await getMinimumBalanceForRentExemptMint(connection);

    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
      TOKEN_METADATA_PROGRAM_ID,
    );

    const tokenAccount = await getAssociatedTokenAddress(mintPubkey, payer, false, programId);

    const transaction = new Transaction();

    const hasInviteAccess = await isFeatureFreeServer('Clone Token', inviteCode);
    const ADMIN_PUBLIC_KEY = process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY;

    if (ADMIN_PUBLIC_KEY && !hasInviteAccess) {
      const adminPublicKey = new PublicKey(ADMIN_PUBLIC_KEY);
      console.log(`Charging clone fee: ${FEE_AMOUNT} SOL to ${ADMIN_PUBLIC_KEY}`);

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: adminPublicKey,
          lamports: FEE_LAMPORTS,
        }),
      );
    } else {
      console.log('Free access activated - no fee charged');
    }

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: mintPubkey,
        space: MINT_SIZE,
        lamports,
        programId: programId,
      }),
    );

    transaction.add(createInitializeMintInstruction(mintPubkey, decimals, payer, payer, programId));

    if (uri) {
      transaction.add(
        createCreateMetadataAccountV3Instruction(
          {
            metadata: metadataPDA,
            mint: mintPubkey,
            mintAuthority: payer,
            payer: payer,
            updateAuthority: payer,
          },
          {
            createMetadataAccountArgsV3: {
              data: {
                name,
                symbol,
                uri,
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null,
              },
              isMutable: true,
              collectionDetails: null,
            },
          },
        ),
      );
    }

    transaction.add(
      createAssociatedTokenAccountInstruction(payer, tokenAccount, payer, mintPubkey, programId),
    );

    const amount = BigInt(supply) * BigInt(10 ** decimals);
    transaction.add(
      createMintToInstruction(mintPubkey, tokenAccount, payer, amount, [], programId),
    );

    return {
      transaction,
      mintKeypair,
    };
  } catch (error) {
    console.error('Error building clone transaction:', error);
    throw new Error('Failed to build clone transaction. Please try again.');
  }
}

export { FEE_AMOUNT };
