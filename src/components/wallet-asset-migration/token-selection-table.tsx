// components/wallet-asset-migration/token-selection-table.tsx
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
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { TokenMigration } from '@/types/types';

interface TokenSelectionTableProps {
  tokens: TokenMigration[];
  onTokenToggle?: (mint: string) => void;
  showCheckbox?: boolean;
}

export default function TokenSelectionTable({
  tokens,
  onTokenToggle,
  showCheckbox = false,
}: TokenSelectionTableProps) {
  const handleCopy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Token address copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (tokens.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
        No tokens found
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-background">
      <div className="overflow-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {showCheckbox && (
                <TableHead className="w-12">
                  <span className="sr-only">Select</span>
                </TableHead>
              )}
              <TableHead className="w-16">No.</TableHead>
              <TableHead className="min-w-[180px]">Token Name</TableHead>
              <TableHead className="min-w-[200px]">Token Address</TableHead>
              <TableHead className="text-right min-w-[120px]">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token, index) => (
              <TableRow key={token.mint} className="hover:bg-muted/20 transition-colors">
                {showCheckbox && (
                  <TableCell>
                    <Checkbox
                      checked={token.selected}
                      onCheckedChange={() => onTokenToggle?.(token.mint)}
                    />
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-semibold">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{token.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {token.mint.slice(0, 10)}...{token.mint.slice(-10)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => handleCopy(token.mint)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-base">{token.uiAmount.toFixed(4)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
