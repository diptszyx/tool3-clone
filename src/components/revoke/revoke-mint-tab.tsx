import { useState } from 'react';
import { PublicKey, Transaction, Connection } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useRevokeAuthority } from '@/hooks/revoke-authority/use-revoke-authority';
import { TokenBasicInfo } from '@/hooks/revoke-authority/use-token-authorities';

interface RevokeMintTabProps {
  tokenAddress: string;
  tokenInfo: TokenBasicInfo | null;
  publicKey: PublicKey | null;
  signTransaction: ((transaction: Transaction) => Promise<Transaction>) | undefined;
  connection: Connection;
  onSuccess?: () => void;
}

export function RevokeMintTab({
  tokenAddress,
  tokenInfo,
  publicKey,
  signTransaction,
  connection,
  onSuccess,
}: RevokeMintTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { revokeMintAuthority, isRevoking } = useRevokeAuthority({
    tokenAddress,
    publicKey,
    signTransaction,
    connection,
    programId: tokenInfo?.programId,
    onSuccess: () => {
      setIsDialogOpen(false);
      if (onSuccess) onSuccess();
    },
  });

  const handleRevoke = async () => {
    const success = await revokeMintAuthority();
    if (success) {
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <Alert variant="destructive">
        <AlertTitle>Warning: This action is permanent!</AlertTitle>
        <AlertDescription>
          Once you revoke mint authority, no one can ever mint new tokens for this mint address.
          This action cannot be undone.
        </AlertDescription>
      </Alert>

      <div className="p-4 bg-muted rounded-lg space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current Authority:</span>
          <span className="font-mono text-xs">{publicKey?.toBase58().slice(0, 20)}...</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">After Revoke:</span>
          <span className="font-mono text-xs text-red-600">None (0x000...)</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <strong>What happens after revoking:</strong>
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Total supply becomes fixed forever</li>
          <li>No one can mint additional tokens</li>
          <li>Increases trust for token holders</li>
          <li>Common for NFTs and fixed-supply tokens</li>
        </ul>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full" disabled={!publicKey || isRevoking}>
            {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Revoke Mint Authority
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will <strong>permanently revoke</strong> your mint authority. You will never be
                able to mint more tokens for this address.
              </p>
              <p className="text-red-600 font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-black text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Revoke Authority
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
