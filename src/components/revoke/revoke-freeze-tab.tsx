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
import { toast } from 'sonner';

interface RevokeFreezeTabProps {
  tokenAddress: string;
  tokenInfo: TokenBasicInfo | null;
  publicKey: PublicKey | null;
  signTransaction: ((transaction: Transaction) => Promise<Transaction>) | undefined;
  connection: Connection;
  onSuccess?: () => void;
}

export function RevokeFreezeTab({
  tokenAddress,
  tokenInfo,
  publicKey,
  signTransaction,
  connection,
  onSuccess,
}: RevokeFreezeTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { revokeFreezeAuthority, isRevoking } = useRevokeAuthority({
    tokenAddress,
    publicKey,
    signTransaction,
    connection,
    programId: tokenInfo?.programId,
  });

  const handleRevoke = async () => {
    const result = await revokeFreezeAuthority();

    if (!result.success) {
      console.error(result.error);
      toast.error('Failed to revoke freeze authority');
      return;
    }

    const rpc = connection.rpcEndpoint;
    const isDevnet = rpc.includes('devnet');
    const cluster = isDevnet ? 'devnet' : 'mainnet-beta';

    toast.success('Freeze authority revoked successfully!', {
      description: 'This token can no longer freeze accounts',
      action: {
        label: 'View Transaction',
        onClick: () =>
          window.open(
            `https://orb.helius.dev/tx/${result.signature}?cluster=${cluster}&tab=summary`,
            '_blank',
          ),
      },
    });

    setIsDialogOpen(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="space-y-4 pt-4">
      <Alert className="bg-amber-50 border-2 border-amber-400">
        <AlertTitle className="text-amber-900 font-bold">
          Warning: This action is permanent!
        </AlertTitle>
        <AlertDescription className="text-amber-800">
          Once you revoke freeze authority, no one can ever freeze token accounts. This action
          cannot be undone.
        </AlertDescription>
      </Alert>

      <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">Current Authority:</span>
          <span className="font-mono text-xs text-black">
            {publicKey?.toBase58().slice(0, 20)}...
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">After Revoke:</span>
          <span className="font-mono text-xs text-gray-600">None (0x000...)</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-black font-semibold">What happens after revoking:</p>
        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
          <li>No one can freeze token accounts</li>
          <li>Token holders have full control of their tokens</li>
          <li>Increases decentralization and trust</li>
          <li>Common for community tokens</li>
        </ul>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold"
            disabled={!publicKey || isRevoking}
          >
            {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Revoke Freeze Authority
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <div className="text-gray-700">
                  This will <strong className="text-black">permanently revoke</strong> your freeze
                  authority. You will never be able to freeze token accounts for this address.
                </div>
                <div className="text-gray-800 font-bold">This action cannot be undone.</div>
              </div>
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
