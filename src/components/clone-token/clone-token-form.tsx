'use client';

import { useCallback, useEffect } from 'react';
import { useCloneTokenInfo } from '@/hooks/clone-token/use-clone-token-info';
import { useCreateClone } from '@/hooks/clone-token/use-create-clone';
import { TokenAddressInput } from './token-address-input';
import { OriginalTokenCard } from './original-token-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { useConnection } from '@/hooks/use-connection';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNetwork } from '@/context/NetworkContext';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { FEE_AMOUNT } from '@/lib/clone-token/create-clone-transaction';

export default function CloneTokenForm() {
  const isMobile = useIsMobile();
  const connection = useConnection();
  const { network } = useNetwork();

  const {
    tokenInfo,
    isLoading: isFetching,
    error: fetchError,
    fetchInfo,
    reset,
  } = useCloneTokenInfo(connection);

  const {
    isCreating,
    error: createError,
    result,
    createClone,
    reset: resetCreate,
    isFreeFeature,
  } = useCreateClone(connection);

  const handleAddressChange = useCallback(
    (address: string) => {
      reset();
      resetCreate();
      if (address) fetchInfo(address);
    },
    [reset, resetCreate, fetchInfo],
  );

  const handleClone = async () => {
    if (!tokenInfo) return;
    await createClone(tokenInfo);
  };

  useEffect(() => {
    if (!createError) return;

    if (createError === 'WALLET_NOT_CONNECTED') {
      toast.error('Please connect your wallet');
      return;
    }

    if (createError === 'WALLET_NOT_SUPPORTED') {
      toast.error('This wallet does not support sending transactions');
      return;
    }

    toast.error('Clone failed');
  }, [createError]);

  useEffect(() => {
    if (!result) return;

    const solscan =
      network === WalletAdapterNetwork.Devnet
        ? `https://solscan.io/token/${result.mintAddress}?cluster=devnet`
        : `https://solscan.io/token/${result.mintAddress}`;

    toast.success('Token cloned successfully!', {
      description: (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-secondary/50 px-2 py-1 rounded font-mono">
              {result.mintAddress}
            </code>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(result.mintAddress);
                toast.success('Copied!');
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>

          <a
            href={solscan}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            View on Solscan
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ),
      duration: 10000,
    });

    setTimeout(() => {
      reset();
      resetCreate();
    }, 500);
  }, [result, network, reset, resetCreate]);

  return (
    <div className={`max-h-[calc(100vh-100px)] overflow-y-auto ${isMobile ? 'py-2' : 'py-6'}`}>
      <div className={`md:p-2 max-w-2xl mx-auto my-2 ${!isMobile && 'border-gear'}`}>
        <div className="space-y-6 px-[5px]">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Clone Token</h1>
            <p className="text-sm text-gray-700">
              Enter a token address to clone it with the same metadata
            </p>
          </div>

          <div
            className={`p-3 rounded-lg border-2 ${
              isFreeFeature ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'
            }`}
          >
            <p className="text-sm font-medium">
              {isFreeFeature ? (
                <span className="text-green-800">Free access activated</span>
              ) : (
                <span className="text-gray-700">Clone Fee: {FEE_AMOUNT} SOL</span>
              )}
            </p>
          </div>

          <TokenAddressInput onAddressChange={handleAddressChange} isLoading={isFetching} />

          {fetchError && (
            <Alert className="bg-amber-50 border-2 border-amber-400">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertDescription className="text-amber-800 ml-2">{fetchError}</AlertDescription>
            </Alert>
          )}

          {tokenInfo && (
            <div className="space-y-4">
              <OriginalTokenCard tokenInfo={tokenInfo} />

              <Button
                onClick={handleClone}
                disabled={isCreating}
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-lg"
                size="lg"
              >
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <span>Creating Clone...</span>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                ) : (
                  'Clone This Token'
                )}
              </Button>

              <div className="p-3 bg-gray-50 border-2 border-gray-300 rounded-lg">
                <p className="text-xs text-gray-700">
                  The cloned token keeps all metadata of the original token.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
