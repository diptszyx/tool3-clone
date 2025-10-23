import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import { pinJSONToIPFS, ipfsToHTTP } from '@/utils/pinata';
import { ClusterType } from '@/types/types';

interface CreateSPLTokenRequestBody {
  walletPublicKey: string;
  name: string;
  symbol: string;
  decimals: string | number;
  supply: string | number;
  description?: string;
  imageUrl?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
  cluster?: ClusterType;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSPLTokenRequestBody = await request.json();

    const {
      walletPublicKey,
      name: tokenName,
      symbol: tokenSymbol,
      decimals,
      supply,
      description,
      imageUrl,
      websiteUrl,
      twitterUrl,
      telegramUrl,
      discordUrl,
      cluster = 'devnet', // eslint-disable-line @typescript-eslint/no-unused-vars
    } = body;

    // Validate required fields
    if (!walletPublicKey || !tokenName || !tokenSymbol) {
      return NextResponse.json(
        { error: 'Missing required fields: walletPublicKey, name, symbol' },
        { status: 400 },
      );
    }

    // Validate and parse numeric values
    const decimalsNum = typeof decimals === 'string' ? parseInt(decimals) : decimals;
    const supplyAmount = typeof supply === 'string' ? parseFloat(supply) : supply;

    if (isNaN(decimalsNum) || decimalsNum < 0 || decimalsNum > 9) {
      return NextResponse.json({ error: 'Decimals must be a number between 0-9' }, { status: 400 });
    }

    if (isNaN(supplyAmount) || supplyAmount <= 0) {
      return NextResponse.json({ error: 'Supply must be greater than 0' }, { status: 400 });
    }

    // Không cần setup Umi nữa, chỉ tạo data

    // Convert image URL from IPFS to HTTP if needed
    const imageHttpUrl = imageUrl ? ipfsToHTTP(imageUrl) : '';

    // Create metadata object theo chuẩn SPL Token (Fungible Token) như docs Metaplex
    const metadataBase: Record<string, unknown> = {
      name: tokenName,
      symbol: tokenSymbol,
      description: description || '',
    };

    // Chỉ thêm external_url nếu có
    if (websiteUrl && websiteUrl.trim() !== '') {
      metadataBase.external_url = websiteUrl;
    }

    // Thêm image nếu có (theo chuẩn đơn giản)
    if (imageHttpUrl && imageHttpUrl.trim() !== '') {
      metadataBase.image = imageHttpUrl;
    }

    // Thêm properties chỉ khi cần thiết (social links)
    const properties: Record<string, unknown> = {};
    let hasProperties = false;

    if (twitterUrl && twitterUrl.trim() !== '') {
      properties.twitter = twitterUrl;
      hasProperties = true;
    }
    if (telegramUrl && telegramUrl.trim() !== '') {
      properties.telegram = telegramUrl;
      hasProperties = true;
    }
    if (discordUrl && discordUrl.trim() !== '') {
      properties.discord = discordUrl;
      hasProperties = true;
    }

    // Chỉ thêm properties nếu có data
    if (hasProperties) {
      metadataBase.properties = properties;
    }

    // Upload metadata to IPFS
    const metadataUri = await pinJSONToIPFS(metadataBase);

    // Tạo mint keypair đơn giản bằng Web3.js
    const mintKeypair = Keypair.generate();
    const mintAmount = Math.floor(supplyAmount * Math.pow(10, decimalsNum));
    return NextResponse.json({
      success: true,
      mint: mintKeypair.publicKey.toString(),
      decimals: decimalsNum,
      mintAmount: mintAmount.toString(),
      metadataUri,
      mintKeypair: Array.from(mintKeypair.secretKey), // Client sẽ dùng mint keypair này
      tokenData: {
        name: tokenName,
        symbol: tokenSymbol,
        uri: metadataUri,
        decimals: decimalsNum,
        amount: mintAmount,
      },
    });
  } catch (error: unknown) {
    console.error('Create SPL token error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create SPL token transaction';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
