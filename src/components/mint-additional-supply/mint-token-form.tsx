'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useTokenInfo } from '@/hooks/use-token-info';
import { useMintToken, isValidAmount } from '@/hooks/use-mint-token';
import { useConnection } from '@/hooks/use-connection';
import { TokenAddressInput } from './token-address-input';
import { TokenInfoCard } from './token-info-card';
import { MintAmountInput } from './mint-amount-input';

export default function MintTokenForm() {
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

  const canMint = tokenInfo?.canMint && isValidAmount(mintAmount);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Mint Additional Token Supply</CardTitle>
        <CardDescription>Supports SPL Token and Token-2022</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          className={`p-3 rounded-lg border ${
            isFreeFeature
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
              : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
          }`}
        >
          <p className="text-sm">
            {isFreeFeature ? (
              <>
                <strong> Free access activated!</strong>
              </>
            ) : (
              <>
                <strong>Minting Fee:</strong> 0.001 SOL
              </>
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
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              You don&apos;t have permission to mint this token. The mint authority belongs to
              another wallet.
            </p>
          </div>
        )}

        {tokenInfo?.canMint && (
          <>
            <MintAmountInput
              value={mintAmount}
              onChange={setMintAmount}
              tokenSymbol={tokenInfo.metadata?.symbol}
            />

            <Button
              disabled={!canMint || isMinting}
              onClick={() => mintTokens(mintAmount)}
              className="w-full"
            >
              {isMinting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isMinting ? 'Minting...' : 'Mint Token'}
            </Button>
          </>
        )}

        {!publicKey && (
          <p className="text-sm text-center text-muted-foreground">
            Please connect your wallet to continue
          </p>
        )}
      </CardContent>
    </Card>
  );
}
