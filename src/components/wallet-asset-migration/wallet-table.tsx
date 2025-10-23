// components/wallet-asset-migration/wallet-table.tsx
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TokenSelectionTable from './token-selection-table';
import type { WalletMigration } from '@/types/types';
import { ChevronDown, ChevronUp, Loader2, Copy } from 'lucide-react';
import { useState, useRef, useEffect, memo } from 'react';
import { toast } from 'sonner';

interface WalletTableProps {
  wallets: WalletMigration[];
  onWalletToggle: (address: string) => void;
  onTokenToggle?: (walletAddress: string, tokenMint: string) => void;
  loadingWallets?: Set<string>;
}

const WalletTable = memo(function WalletTable({
  wallets,
  onWalletToggle,
  onTokenToggle,
  loadingWallets = new Set(),
}: WalletTableProps) {
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);

  const allSelected = wallets.length > 0 && wallets.every((w) => w.selected);
  const someSelected = wallets.some((w) => w.selected) && !allSelected;
  const selectAllRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const input = selectAllRef.current?.querySelector('input');
    if (input) input.indeterminate = someSelected;
  }, [someSelected]);

  const handleSelectAll = () => {
    const shouldSelectAll = !allSelected;

    wallets.forEach((wallet) => {
      if (wallet.selected !== shouldSelectAll) {
        onWalletToggle(wallet.address);
      }
    });
  };

  const handleCopy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (wallets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        No wallets added yet
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">
              <Checkbox
                ref={selectAllRef}
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="min-w-[200px]">Wallet Address</TableHead>
            <TableHead className="text-right w-32">SOL Balance</TableHead>
            <TableHead className="text-right w-24">Tokens</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wallets.map((wallet) => {
            const isLoading = loadingWallets.has(wallet.address);
            const isExpanded = expandedWallet === wallet.address;

            // Calculate indeterminate state for wallet checkbox
            const selectedTokenCount = wallet.tokens.filter((t) => t.selected).length;
            const isIndeterminate =
              selectedTokenCount > 0 && selectedTokenCount < wallet.tokens.length;

            return (
              <>
                {/* Main Wallet Row */}
                <TableRow key={wallet.address} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <Checkbox
                      checked={wallet.selected}
                      ref={(el) => {
                        if (el) {
                          const input = el.querySelector('input');
                          if (input) input.indeterminate = isIndeterminate;
                        }
                      }}
                      onCheckedChange={() => onWalletToggle(wallet.address)}
                      disabled={isLoading}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <span>
                        {wallet.address.slice(0, 8)}...
                        {wallet.address.slice(-8)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopy(wallet.address)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {isLoading ? (
                      <Skeleton className="h-5 w-24 ml-auto" />
                    ) : (
                      <span className="font-semibold">{wallet.solBalance.toFixed(4)} SOL</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isLoading ? (
                      <Skeleton className="h-5 w-12 ml-auto" />
                    ) : (
                      <span className="font-medium">{wallet.tokens.length}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        wallet.tokens.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setExpandedWallet(isExpanded ? null : wallet.address)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expanded Token Table - LARGER & CLEARER */}
                {isExpanded && wallet.tokens.length > 0 && (
                  <TableRow className="bg-muted/10 hover:bg-muted/10">
                    <TableCell colSpan={5} className="p-0">
                      <div className="px-6 py-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            SPL Tokens ({wallet.tokens.length})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedTokenCount} selected
                          </p>
                        </div>
                        <TokenSelectionTable
                          tokens={wallet.tokens}
                          showCheckbox={true}
                          onTokenToggle={(mint) => onTokenToggle?.(wallet.address, mint)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

export default WalletTable;
