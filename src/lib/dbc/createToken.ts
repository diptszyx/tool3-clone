import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { connectionMainnet } from '@/service/solana/connection';
import { uploadFileToIPFS, uploadMetadataToIPFS, TokenMetadata } from '@/lib/dbc/metadata';
import { isWhitelisted } from '@/utils/whitelist';
import { isFeatureFreeServer } from '@/lib/invite-codes/check-server';

export interface CreateTokenParams {
  name: string;
  symbol: string;
  description?: string;
  socialX?: string;
  socialTelegram?: string;
  socialWebsite?: string;
  file: File;
  userPublicKey: PublicKey;
  inviteCode?: string;
}

export async function createTokenTransaction(params: CreateTokenParams): Promise<{
  transaction: Transaction;
  baseMint: Keypair;
}> {
  const {
    name,
    symbol,
    description,
    socialX,
    socialTelegram,
    socialWebsite,
    file,
    userPublicKey,
    inviteCode,
  } = params;

  const imageUrl = await uploadFileToIPFS(file);

  const metadata: TokenMetadata = {
    name,
    symbol,
    description: description || '',
    image: imageUrl,
    showName: true,
    createdOn: 'https://tool3.xyz',
    socialX: socialX || '',
    socialTelegram: socialTelegram || '',
    socialWebsite: socialWebsite || '',
  };

  const metadataUri = await uploadMetadataToIPFS(metadata);

  const client = new DynamicBondingCurveClient(connectionMainnet, 'confirmed');

  const CONFIG_PUBLIC_KEY = process.env.NEXT_PUBLIC_DBC_CONFIG_MAINNET;
  if (!CONFIG_PUBLIC_KEY) {
    throw new Error('Missing DBC_CONFIG_MAINNET in env');
  }

  const config = new PublicKey(CONFIG_PUBLIC_KEY);
  const baseMint = Keypair.generate();
  const payer = userPublicKey;
  const poolCreator = userPublicKey;

  const createPoolParams = {
    name,
    symbol,
    uri: metadataUri,
    baseMint: baseMint.publicKey,
    config,
    payer,
    poolCreator,
  };

  const transaction = await client.pool.createPool(createPoolParams);
  const hasInviteAccess = await isFeatureFreeServer('Launch Token DBC Meteora', inviteCode);

  const ADMIN_PUBLIC_KEY = process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY;
  const isWhitelistedUser = isWhitelisted(payer.toBase58());

  if (ADMIN_PUBLIC_KEY && !isWhitelistedUser && !hasInviteAccess) {
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(ADMIN_PUBLIC_KEY),
      lamports: 0.002 * LAMPORTS_PER_SOL,
    });
    transaction.add(transferInstruction);
    console.log('Added fee instruction: 0.002 SOL');
  } else {
    console.log('No fee charged (free access or whitelisted)');
  }

  const { blockhash } = await connectionMainnet.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer;

  transaction.partialSign(baseMint);

  return { transaction, baseMint };
}
