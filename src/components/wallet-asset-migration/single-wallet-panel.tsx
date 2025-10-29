'use client';

import { useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import TokenSelectionTable from './token-selection-table';
import type { WalletMigration } from '@/types/types';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { toast } from 'sonner';
import { useWalletData } from '@/hooks/use-wallet-data';
import { Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SingleWalletPanelProps {
  wallet: WalletMigration | null;
  onWalletChange: (wallet: WalletMigration | null) => void;
  onTokenToggle: (tokenMint: string) => void;
  destinationAddress: string;
  onDestinationChange: (address: string) => void;
  includeSol: boolean;
  onIncludeSolChange: (include: boolean) => void;
  cluster?: 'mainnet' | 'devnet';
}

export default function SingleWalletPanel({
  wallet,
  onWalletChange,
  onTokenToggle,
  destinationAddress,
  onDestinationChange,
  includeSol,
  onIncludeSolChange,
  cluster = 'mainnet',
}: SingleWalletPanelProps) {
  const { publicKey, connected } = useWallet();
  const { fetchWalletData, loading } = useWalletData(cluster);

  const loadWalletData = useCallback(
    async (address: string) => {
      try {
        const data = await fetchWalletData(address);
        if (!data) {
          toast.error('Failed to fetch wallet data');
          return;
        }

        const walletWithSelectedTokens: WalletMigration = {
          ...data,
          selected: true,
          tokens: data.tokens.map((t) => ({ ...t, selected: true })),
        };

        onWalletChange(walletWithSelectedTokens);
      } catch (error) {
        console.error('Error loading wallet data:', error);
        toast.error('Unexpected error loading wallet data');
      }
    },
    [fetchWalletData, onWalletChange],
  );

  useEffect(() => {
    if (connected && publicKey) {
      loadWalletData(publicKey.toBase58());
    } else {
      onWalletChange(null);
    }
  }, [connected, publicKey, loadWalletData, onWalletChange]);

  const handleCopy = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied');
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  const isLoading = wallet && loading.has(wallet.address);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-3">Connected Wallet</h3>

        {!connected ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <p className="text-sm text-muted-foreground">Connect your wallet to continue</p>
            <WalletMultiButton />
          </div>
        ) : wallet ? (
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium">
                {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleCopy(wallet.address)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <span className="text-muted-foreground">
                Balance:{' '}
                <span className="font-semibold text-foreground">
                  {wallet.solBalance.toFixed(4)} SOL
                </span>
              </span>
              <span className="text-muted-foreground">
                Tokens:{' '}
                <span className="font-semibold text-foreground">{wallet.tokens.length}</span>
              </span>
            </div>
          </div>
        ) : null}
      </Card>

      {wallet && (
        <Card className="p-4">
          <h3 className="text-base font-semibold mb-3">
            Wallet Assets
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (Select tokens to migrate)
            </span>
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <TokenSelectionTable
              tokens={wallet.tokens}
              showCheckbox={true}
              onTokenToggle={onTokenToggle}
            />
          )}
        </Card>
      )}

      <Card className="p-4">
        <h3 className="text-base font-semibold mb-3">Migration Settings</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="destination">Destination Wallet Address</Label>
            <Input
              id="destination"
              placeholder="Enter destination wallet address..."
              value={destinationAddress}
              onChange={(e) => onDestinationChange(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Checkbox
              id="includeSol"
              checked={includeSol}
              onCheckedChange={(checked) => onIncludeSolChange(checked as boolean)}
            />
            <Label htmlFor="includeSol" className="cursor-pointer">
              Include SOL in transfer
            </Label>
          </div>
        </div>
      </Card>
    </div>
  );
}
