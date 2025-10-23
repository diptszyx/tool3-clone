'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { WalletMigration } from '@/types/types';
import { AlertTriangle, Wallet, ArrowRight, Coins } from 'lucide-react';

interface MigrationConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: WalletMigration[];
  destinationAddress: string;
  includeSol: boolean;
  onConfirm: () => void;
  loading?: boolean;
}

export default function MigrationConfirmModal({
  open,
  onOpenChange,
  wallets,
  destinationAddress,
  includeSol,
  onConfirm,
  loading = false,
}: MigrationConfirmModalProps) {
  const selectedWallets = wallets.filter((w) => w.selected);

  const totalStats = selectedWallets.reduce(
    (acc, wallet) => {
      const selectedTokens = wallet.tokens.filter((t) => t.selected);
      return {
        wallets: acc.wallets + 1,
        tokens: acc.tokens + selectedTokens.length,
        sol: acc.sol + (includeSol ? wallet.solBalance : 0),
      };
    },
    { wallets: 0, tokens: 0, sol: 0 },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Confirm Migration
          </DialogTitle>
          <DialogDescription>
            Please review the migration details before proceeding
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 px-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          <div className="space-y-6 pb-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Wallet className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{totalStats.wallets}</div>
                <div className="text-xs text-muted-foreground">Wallets</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Coins className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{totalStats.tokens}</div>
                <div className="text-xs text-muted-foreground">Tokens</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{totalStats.sol.toFixed(4)}</div>
                <div className="text-xs text-muted-foreground">SOL</div>
              </div>
            </div>

            {/* Destination Address */}
            <div className="space-y-2">
              <div className="text-sm font-semibold">Destination Address</div>
              <div className="bg-muted/30 p-3 rounded-lg font-mono text-sm break-all">
                {destinationAddress}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="text-sm font-semibold">Migration Details</div>
              {selectedWallets.map((wallet, idx) => {
                const selectedTokens = wallet.tokens.filter((t) => t.selected);
                return (
                  <div key={wallet.address} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1">Wallet #{idx + 1}</div>
                        <div className="font-mono text-sm break-all">
                          {wallet.address.slice(0, 16)}...{wallet.address.slice(-16)}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>

                    <div className="space-y-2 text-sm">
                      {includeSol && wallet.solBalance > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SOL Balance:</span>
                          <span className="font-semibold">{wallet.solBalance.toFixed(4)} SOL</span>
                        </div>
                      )}
                      {selectedTokens.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tokens:</span>
                          <span className="font-semibold">{selectedTokens.length} tokens</span>
                        </div>
                      )}
                      {selectedTokens.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {selectedTokens.slice(0, 3).map((token) => (
                            <div
                              key={token.mint}
                              className="flex justify-between text-xs bg-muted/30 p-2 rounded"
                            >
                              <span>{token.symbol}</span>
                              <span className="font-medium">{token.uiAmount.toFixed(4)}</span>
                            </div>
                          ))}
                          {selectedTokens.length > 3 && (
                            <div className="text-xs text-center text-muted-foreground py-1">
                              ... and {selectedTokens.length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Alert variant="destructive" className="bg-yellow-500/10 border-yellow-500/50">
              <AlertTriangle className="h-4 w-4 !text-yellow-500" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                This action cannot be undone. Please verify all details before confirming.
              </AlertDescription>
            </Alert>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Migration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
