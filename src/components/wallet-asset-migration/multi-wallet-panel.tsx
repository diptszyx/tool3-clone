'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import WalletTable from './wallet-table';
import AddWalletModal from './add-wallet-modal';
import type { WalletMigration } from '@/types/types';
import { Plus } from 'lucide-react';
import { useWalletData } from '@/hooks/use-wallet-data';

interface MultiWalletPanelProps {
  wallets: WalletMigration[];
  onWalletToggle: (address: string) => void;
  onAddWallet: (wallet: WalletMigration) => void;
  onTokenToggle: (walletAddress: string, tokenMint: string) => void;
  destinationAddress: string;
  onDestinationChange: (address: string) => void;
  includeSol: boolean;
  onIncludeSolChange: (include: boolean) => void;
  cluster?: 'mainnet' | 'devnet';
  onPasswordReceived?: (password: string) => void;
}

export default function MultiWalletPanel({
  wallets,
  onWalletToggle,
  onAddWallet,
  onTokenToggle,
  destinationAddress,
  onDestinationChange,
  includeSol,
  onIncludeSolChange,
  cluster = 'devnet',
  onPasswordReceived,
}: MultiWalletPanelProps) {
  const [addWalletOpen, setAddWalletOpen] = useState(false);
  const { fetchWalletData, loading } = useWalletData(cluster);

  const handleAddWallets = useCallback(
    async (publicKeys: string[], password?: string) => {
      setAddWalletOpen(false);
      if (password) {
        onPasswordReceived?.(password);
      }

      for (const publicKey of publicKeys) {
        if (wallets.some((w) => w.address === publicKey)) continue;

        onAddWallet({
          address: publicKey,
          solBalance: 0,
          tokens: [],
          selected: false,
        });

        const data = await fetchWalletData(publicKey);
        if (data) {
          onAddWallet(data);
        }
      }
    },
    [wallets, fetchWalletData, onAddWallet, onPasswordReceived],
  );

  const handleAddWalletsWithKeys = useCallback(
    async (walletsData: Array<{ address: string; privateKey: string }>) => {
      setAddWalletOpen(false);

      for (const { address, privateKey } of walletsData) {
        if (wallets.some((w) => w.address === address)) continue;

        onAddWallet({
          address,
          solBalance: 0,
          tokens: [],
          selected: false,
          privateKey,
        });

        const data = await fetchWalletData(address);
        if (data) {
          onAddWallet({
            ...data,
            privateKey,
          });
        }
      }
    },
    [wallets, fetchWalletData, onAddWallet],
  );

  return (
    <div className="space-y-4">
      <Button onClick={() => setAddWalletOpen(true)} className="w-full gap-2">
        <Plus className="h-4 w-4" />
        Add Wallets
      </Button>

      {wallets.length > 0 && (
        <Card className="p-4">
          <h3 className="text-base font-semibold mb-3">Wallets</h3>
          <WalletTable
            wallets={wallets}
            onWalletToggle={onWalletToggle}
            onTokenToggle={onTokenToggle}
            loadingWallets={loading}
          />
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

      <AddWalletModal
        open={addWalletOpen}
        onOpenChange={setAddWalletOpen}
        onAddWallets={handleAddWallets}
        onAddWalletsWithKeys={handleAddWalletsWithKeys}
      />
    </div>
  );
}
