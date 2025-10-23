'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ModeSelector from './mode-selector';
import MultiWalletPanel from './multi-wallet-panel';
import SingleWalletPanel from './single-wallet-panel';
import SecurityHint from './security-hint';
import type { WalletMigration, TokenMigration } from '@/types/types';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import MigrationConfirmModal from './migration-confirm-modal';
import { useWalletData } from '@/hooks/use-wallet-data';
import { useMigration } from '@/hooks/useMigration';
import {
  SingleMigrationSuccess,
  MultiMigrationSuccess,
  MultiMigrationError,
} from '@/components/wallet-asset-migration/migration-toast-content';

export default function AssetMigration() {
  const [mode, setMode] = useState<'multi' | 'single'>('multi');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [includeSol, setIncludeSol] = useState(true);
  const [singleWallet, setSingleWallet] = useState<WalletMigration | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { wallets, refreshAllWallets, refreshWallet, clearWallets, addWallet, setWallets } =
    useWalletData('devnet');

  const { migrationInProgress, setMasterPassword, migrateSingleWallet, migrateMultipleWallets } =
    useMigration({
      onSuccess: async () => {
        if (mode === 'single' && singleWallet) {
          const updated = await refreshWallet(singleWallet.address);
          if (updated) {
            setSingleWallet(updated);
          }
        } else {
          await refreshAllWallets();
        }
        setDestinationAddress('');
      },
      onError: (error) => {
        console.error('Migration failed:', error);
      },
    });

  useEffect(() => {
    return () => {
      setMasterPassword(null);
    };
  }, [setMasterPassword]);

  const handleModeChange = useCallback(
    (newMode: 'multi' | 'single') => {
      setMode(newMode);
      setDestinationAddress('');
      setSingleWallet(null);
      setMasterPassword(null);

      if (newMode === 'single') {
        clearWallets();
      }
    },
    [clearWallets, setMasterPassword],
  );

  const handleWalletToggle = useCallback(
    (address: string) => {
      setWallets((prev) => {
        const wallet = prev.find((w) => w.address === address);
        if (!wallet) return prev;
        const newSelected = !wallet.selected;
        return prev.map((w) =>
          w.address === address
            ? {
                ...w,
                selected: newSelected,
                tokens: w.tokens.map((t: TokenMigration) => ({
                  ...t,
                  selected: newSelected,
                })),
              }
            : w,
        );
      });
    },
    [setWallets],
  );

  const handleTokenToggle = useCallback(
    (walletAddress: string, tokenMint: string) => {
      setWallets((prev) =>
        prev.map((w) =>
          w.address === walletAddress
            ? {
                ...w,
                tokens: w.tokens.map((t: TokenMigration) =>
                  t.mint === tokenMint ? { ...t, selected: !t.selected } : t,
                ),
              }
            : w,
        ),
      );
    },
    [setWallets],
  );

  const handleSingleWalletTokenToggle = useCallback(
    (tokenMint: string) => {
      if (!singleWallet) return;
      setSingleWallet({
        ...singleWallet,
        tokens: singleWallet.tokens.map((t) =>
          t.mint === tokenMint ? { ...t, selected: !t.selected } : t,
        ),
      });
    },
    [singleWallet],
  );

  const validateMigration = useCallback((): boolean => {
    if (mode === 'multi') {
      const selectedCount = wallets.filter((w) => w.selected).length;
      if (selectedCount === 0) {
        toast.error('Please select at least one wallet');
        return false;
      }
    } else {
      if (!singleWallet) {
        toast.error('Please connect your wallet');
        return false;
      }
      const selectedTokens = singleWallet.tokens.filter((t) => t.selected);
      if (selectedTokens.length === 0 && !includeSol) {
        toast.error('Please select at least one token or include SOL');
        return false;
      }
      if (includeSol && singleWallet.solBalance === 0) {
        toast.error('No SOL balance to transfer');
        return false;
      }
    }

    if (!destinationAddress.trim()) {
      toast.error('Please enter destination wallet address');
      return false;
    }

    if (destinationAddress.length < 32 || destinationAddress.length > 44) {
      toast.error('Invalid destination wallet address format');
      return false;
    }

    if (mode === 'single' && singleWallet && singleWallet.address === destinationAddress) {
      toast.error('Destination address cannot be the same as source wallet');
      return false;
    }

    return true;
  }, [mode, wallets, singleWallet, destinationAddress, includeSol]);

  const handleMigration = useCallback(async () => {
    setShowConfirmModal(false);
    if (!validateMigration()) return;

    try {
      if (mode === 'single' && singleWallet) {
        const result = await migrateSingleWallet(singleWallet, destinationAddress, includeSol);
        if (result.success) {
          toast.success(`Migration completed! ${result.tokensTransferred} token(s) transferred.`, {
            duration: 5000,
            description: <SingleMigrationSuccess signature={result.signature} />,
          });
        }
      } else if (mode === 'multi') {
        const result = await migrateMultipleWallets(wallets, destinationAddress, includeSol);
        if (result.success) {
          toast.success(
            `Migration completed! ${result.successfulWallets}/${result.totalWallets} wallets migrated.`,
            {
              duration: 5000,
              description: <MultiMigrationSuccess signatures={result.signatures} />,
            },
          );
        } else {
          toast.error(
            `Migration completed with errors: ${result.successfulWallets}/${result.totalWallets} succeeded`,
            {
              duration: 7000,
              description: <MultiMigrationError errors={result.errors} />,
            },
          );
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  }, [
    validateMigration,
    mode,
    singleWallet,
    destinationAddress,
    includeSol,
    migrateSingleWallet,
    migrateMultipleWallets,
    wallets,
  ]);

  const handleMigrationClick = useCallback(() => {
    if (!validateMigration()) return;
    if (mode === 'multi') {
      setShowConfirmModal(true);
    } else {
      handleMigration();
    }
  }, [validateMigration, mode, handleMigration]); // ✅ added handleMigration to deps

  const canMigrate = useMemo(
    () =>
      mode === 'single'
        ? singleWallet && destinationAddress.trim() !== ''
        : wallets.filter((w) => w.selected).length > 0 && destinationAddress.trim() !== '',
    [mode, singleWallet, wallets, destinationAddress],
  );

  return (
    <div className="h-full flex mt-10 md:mt-0">
      <div className="container mx-auto px-4 max-h-[calc(100vh-100px)] overflow-y-auto py-5">
        <div className="w-full max-w-3xl mx-auto space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Solana Asset Migration</h1>
            <p className="text-muted-foreground">
              Consolidate your SOL and SPL tokens from multiple wallets into a single destination
            </p>
          </div>

          <SecurityHint />

          <Card className="p-6">
            <ModeSelector mode={mode} onModeChange={handleModeChange} />
          </Card>

          {mode === 'multi' ? (
            <MultiWalletPanel
              wallets={wallets}
              onWalletToggle={handleWalletToggle}
              onTokenToggle={handleTokenToggle}
              onAddWallet={addWallet}
              destinationAddress={destinationAddress}
              onDestinationChange={setDestinationAddress}
              includeSol={includeSol}
              onIncludeSolChange={setIncludeSol}
              onPasswordReceived={setMasterPassword}
            />
          ) : (
            <SingleWalletPanel
              wallet={singleWallet}
              onWalletChange={setSingleWallet}
              onTokenToggle={handleSingleWalletTokenToggle}
              destinationAddress={destinationAddress}
              onDestinationChange={setDestinationAddress}
              includeSol={includeSol}
              onIncludeSolChange={setIncludeSol}
            />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleMigrationClick}
              className="gap-2"
              disabled={migrationInProgress || !canMigrate}
            >
              {migrationInProgress ? 'Migrating...' : 'Migrate Assets'}
              {!migrationInProgress && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <MigrationConfirmModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        wallets={wallets}
        destinationAddress={destinationAddress}
        includeSol={includeSol}
        onConfirm={handleMigration}
        loading={migrationInProgress}
      />
    </div>
  );
}
