'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTokenInfo } from '@/hooks/use-token-info';
import { useMintToken, isValidAmount } from '@/hooks/use-mint-token';
import { useConnection } from '@/hooks/use-connection';
import { TokenAddressInput } from './token-address-input';
import { TokenInfoCard } from './token-info-card';
import { MintAmountInput } from './mint-amount-input';
import { useIsMobile } from '@/hooks/use-mobile';

export default function MintTokenForm() {
  const isMobile = useIsMobile();
  const { publicKey, signTransaction } = useWallet();
  const connection = useConnection();

  const [tokenAddress, setTokenAddress] = useState('');
  const [mintAmount, setMintAmount] = useState('');

  const { tokenInfo, isChecking, updateSupplyOptimistically } = useTokenInfo(
    tokenAddress,
    publicKey,
    connection,
  );

  const { mintTokens, isMinting, isFreeFeature } = useMintToken({
    tokenAddress,
    tokenInfo,
    publicKey,
    signTransaction,
    connection,
    onSuccess: () => {
      const mintedAmount = parseFloat(mintAmount);
      updateSupplyOptimistically(mintedAmount);
      setMintAmount('');
    },
  });

  const showToastError = (code: string) => {
    const messages: Record<string, string> = {
      WALLET_NOT_CONNECTED: 'Please connect your wallet.',
      NO_MINT_AUTHORITY: 'You do not have mint authority.',
      INVALID_AMOUNT: 'Please enter a valid positive amount.',
      AMOUNT_TOO_LARGE: 'Amount too large.',
      MINT_FAILED: 'Mint failed.',
    };
    toast.error(messages[code] || code);
  };

  const handleMint = async () => {
    const result = await mintTokens(mintAmount);

    if (!result.ok) {
      showToastError(result.error ?? 'MINT_FAILED');
      return;
    }

    const rpc = connection.rpcEndpoint;
    const isDevnet = rpc.includes('devnet');
    const cluster = isDevnet ? 'devnet' : 'mainnet-beta';

    toast.success('Mint token successful', {
      description: `You have minted ${Number(mintAmount).toLocaleString()} ${tokenInfo?.metadata?.symbol || 'tokens'}`,
      action: {
        label: 'View Transaction',
        onClick: () =>
          window.open(
            `https://orb.helius.dev/tx/${result.signature}?cluster=${cluster}&tab=summary`,
            '_blank',
          ),
      },
    });
  };

  const canMint = tokenInfo?.canMint && isValidAmount(mintAmount);

  return (
    <div className={`max-h-[calc(100vh-100px)] overflow-y-auto ${isMobile ? 'py-2' : 'py-6'}`}>
      <div className={`md:p-2 max-w-md mx-auto my-2 ${!isMobile && 'border-gear'}`}>
        <div className="space-y-6 px-[5px]">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-black">Mint Token</h1>
            <p className="text-sm text-gray-700">Supports SPL Token and Token-2022</p>
          </div>

          <div
            className={`p-3 rounded-lg border-2 ${
              isFreeFeature ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'
            }`}
          >
            <p className="text-sm font-medium">
              {isFreeFeature ? (
                <span className="text-green-800">
                  <strong>Free access activated!</strong>
                </span>
              ) : (
                <span className="text-gray-700">
                  <strong className="text-black">Minting Fee:</strong> 0.001 SOL
                </span>
              )}
            </p>
          </div>

          <TokenAddressInput
            value={tokenAddress}
            onChange={setTokenAddress}
            isChecking={isChecking}
            tokenInfo={tokenInfo}
          />

          {tokenInfo?.canMint && <TokenInfoCard tokenInfo={tokenInfo} />}

          {tokenInfo && !tokenInfo.canMint && (
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-lg">
              <p className="text-sm text-amber-800 font-medium">
                <strong className="text-amber-900">No Permission:</strong> You don&apos;t have mint
                authority.
              </p>
            </div>
          )}

          {tokenInfo?.canMint && (
            <div className="space-y-4">
              <MintAmountInput
                value={mintAmount}
                onChange={setMintAmount}
                tokenSymbol={tokenInfo.metadata?.symbol}
              />

              <Button
                disabled={!canMint || isMinting}
                onClick={handleMint}
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-colors duration-200 disabled:bg-gray-400"
              >
                {isMinting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isMinting ? 'Minting...' : 'Mint Token'}
              </Button>

              <div className="p-3 bg-gray-50 border-2 border-gray-300 rounded-lg">
                <p className="text-xs text-gray-700 leading-relaxed">
                  <strong className="text-black">Note:</strong> Minting will increase total supply.
                </p>
              </div>
            </div>
          )}

          {!publicKey && (
            <p className="text-sm text-center text-gray-700 font-medium">
              Please connect your wallet to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
