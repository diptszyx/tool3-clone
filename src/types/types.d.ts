export interface Token {
  address: string;
  name: string;
  symbol: string;
  logoURI?: string;
  decimals?: number;
}

export type ClusterType = 'mainnet' | 'devnet';

export interface BatchTransaction {
  transaction: string;
  tokenSwaps: string[];
  expectedSolOutput: number;
  metadata: {
    batchIndex: number;
    swapCount: number;
    instructionCount: number;
    transactionSize: number;
  };
}

export interface TokenMigration {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: number;
  uiAmount: number;
  selected: boolean;
}

export interface WalletMigration {
  address: string;
  solBalance: number;
  tokens: TokenMigration[];
  selected: boolean;
}

export interface MigrationState {
  mode: 'multi' | 'single';
  wallets: Wallet[];
  destinationAddress: string;
  feePayerAddress: string;
  includeSol: boolean;
  selectedWallets: string[];
  migrationInProgress: boolean;
  migrationProgress: number;
  migrationStatus: 'idle' | 'reviewing' | 'migrating' | 'completed' | 'error';
  errorMessage: string;
}
