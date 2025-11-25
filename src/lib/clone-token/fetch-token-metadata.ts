import { Connection, PublicKey } from '@solana/web3.js';
import { getMint, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  uri: string;
  image?: string;
  description?: string;
  programId: PublicKey;
}

interface HeliusAssetResponse {
  id: string;
  content: {
    metadata: {
      name: string;
      symbol: string;
    };
    json_uri: string;
    links?: {
      image?: string;
    };
  };
  token_info: {
    decimals: number;
    supply: number;
    price_info?: unknown;
  };
  interface: string;
}

async function detectTokenProgram(
  connection: Connection,
  mintPubkey: PublicKey,
): Promise<PublicKey> {
  try {
    await getMint(connection, mintPubkey, 'confirmed', TOKEN_PROGRAM_ID);
    return TOKEN_PROGRAM_ID;
  } catch {
    try {
      await getMint(connection, mintPubkey, 'confirmed', TOKEN_2022_PROGRAM_ID);
      return TOKEN_2022_PROGRAM_ID;
    } catch {
      throw new Error('Invalid token mint address');
    }
  }
}

async function fetchHeliusMetadata(tokenAddress: string): Promise<{
  name: string;
  symbol: string;
  uri: string;
  image?: string;
  description?: string;
  decimals: number;
  isNFT: boolean;
} | null> {
  try {
    const url = process.env.NEXT_PUBLIC_RPC_DEVNET;
    if (!url) throw new Error('RPC URL not set in env');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'clone-token',
        method: 'getAsset',
        params: { id: tokenAddress },
      }),
    });

    if (!response.ok) throw new Error('Helius RPC request failed');

    const data = await response.json();
    if (data.error) return null;

    const asset: HeliusAssetResponse = data.result;

    const isNFT =
      asset.interface === 'V1_NFT' ||
      asset.interface === 'ProgrammableNFT' ||
      (asset.token_info.supply === 1 && asset.token_info.decimals === 0);

    if (isNFT) throw new Error('This is an NFT, not a fungible token');

    let image = asset.content.links?.image || '';
    let description = '';

    if (asset.content.json_uri) {
      try {
        const metadataResponse = await fetch(asset.content.json_uri, {
          signal: AbortSignal.timeout(5000),
        });
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          image = metadata.image || image;
          description = metadata.description || '';
        }
      } catch {}
    }

    return {
      name: asset.content.metadata.name,
      symbol: asset.content.metadata.symbol,
      uri: asset.content.json_uri,
      image,
      description,
      decimals: asset.token_info.decimals,
      isNFT,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('NFT')) throw error;
    return null;
  }
}

async function fetchOnChainMetadata(
  connection: Connection,
  mintPubkey: PublicKey,
  programId: PublicKey,
): Promise<{ decimals: number }> {
  const mintInfo = await getMint(connection, mintPubkey, 'confirmed', programId);
  return { decimals: mintInfo.decimals };
}

export async function fetchTokenMetadata(
  connection: Connection,
  tokenAddress: string,
): Promise<TokenMetadata> {
  try {
    const mintPubkey = new PublicKey(tokenAddress);
    const programId = await detectTokenProgram(connection, mintPubkey);

    const heliusData = await fetchHeliusMetadata(tokenAddress);
    if (heliusData) {
      return {
        name: heliusData.name,
        symbol: heliusData.symbol,
        decimals: heliusData.decimals,
        uri: heliusData.uri,
        image: heliusData.image,
        description: heliusData.description,
        programId,
      };
    }

    const onChainData = await fetchOnChainMetadata(connection, mintPubkey, programId);
    return {
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      decimals: onChainData.decimals,
      uri: '',
      programId,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('NFT')) throw error;
    throw new Error('Failed to fetch token metadata. Please check the address.');
  }
}

export function isValidTokenAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
