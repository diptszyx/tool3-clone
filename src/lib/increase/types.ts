import { Keypair } from '@solana/web3.js';
import { z } from 'zod';

export interface WalletInfo {
  keypair: Keypair;
  publicKey: string;
  secretKey: string;
  solAmount: number;
  transferAmount: number;
  result?: 'success' | 'failed';
  tokenBalances?: Array<{
    mint: string;
    amount: number;
  }>;
}

export interface TokenInfo {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  usdPrice: number;
  mcap: number;
  liquidity: number;
  isVerified: boolean;
}

export type FormData = z.infer<typeof FORM_SCHEMA>;

export interface RPCStatus {
  isValid: boolean;
  latency: number;
  error?: string;
}

export interface QuoteStatus {
  isValid: boolean;
  error?: string;
  isChecking: boolean;
}

export const FORM_SCHEMA = z.object({
  rpcUrl: z.string().url('Invalid RPC URL').optional().or(z.literal('')),
  buyAmountMode: z.enum(['fixed', 'random']),
  fixedAmount: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0)
    .optional(),
  randomMin: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0)
    .optional(),
  randomMax: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0)
    .optional(),
  autoSell: z.boolean(),
  dexType: z.enum(['Raydium,Meteora,Orca+V2', 'Raydium Launchlab', 'Pump.fun', 'Pump.fun Amm']),
  quantity: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0 && num <= 10000;
  }),
  customQuantity: z.string().optional(),
});

export const QUANTITY_OPTIONS = ['4', '50', '100', '500', '1000'];

export const DEX_TYPES = {
  MULTIPLE: 'Raydium,Meteora,Orca+V2',
  RAYDIUM_LAUNCH: 'Raydium Launchlab',
  PUMP_FUN: 'Pump.fun',
  PUMP_FUN_AMM: 'Pump.fun Amm',
} as const;

export const DEFAULT_TOKEN: TokenInfo = {
  id: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  name: 'USD Coin',
  symbol: 'USDC',
  icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  decimals: 6,
  usdPrice: 1,
  mcap: 0,
  liquidity: 0,
  isVerified: true,
};

export const getDexDisplayName = (dexType: string): string => {
  switch (dexType) {
    case 'Raydium,Meteora,Orca+V2':
      return 'Raydium/Meteora/Orca';
    case 'Raydium Launchlab':
      return 'Raydium Launchpad';
    case 'Pump.fun':
      return 'Pump.fun';
    case 'Pump.fun Amm':
      return 'PumpSwap (AMM)';
    default:
      return dexType;
  }
};
