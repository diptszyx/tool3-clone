interface JupiterPriceV3Response {
  [tokenAddress: string]: {
    usdPrice: number;
    blockId: number;
    decimals: number;
    priceChange24h: number;
  };
}

const API_BASE = 'https://lite-api.jup.ag';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export async function getTokenFeeFromUsd(
  targetTokenMint: string,
  usdAmount: number,
): Promise<number> {
  try {
    const targetRes = await fetch(`${API_BASE}/price/v3?ids=${targetTokenMint}`);

    if (!targetRes.ok) {
      throw new Error('Jupiter API returned an error');
    }

    const targetData: JupiterPriceV3Response = await targetRes.json();
    const targetTokenUsdPrice = targetData[targetTokenMint].usdPrice;

    return usdAmount / targetTokenUsdPrice;
  } catch (err) {
    throw err;
  }
}

export async function convertSOLToUSDT(solAmount: number): Promise<number> {
  try {
    const response = await fetch(`${API_BASE}/price/v3?ids=${SOL_MINT}`);

    if (!response.ok) {
      throw new Error('Jupiter API returned an error');
    }

    const data: JupiterPriceV3Response = await response.json();
    const solUsdPrice = data[SOL_MINT].usdPrice;

    return solAmount * solUsdPrice;
  } catch (err) {
    throw err;
  }
}
