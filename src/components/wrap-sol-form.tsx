'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, ArrowDownUp } from 'lucide-react';
import { wrapSol, unwrapSol, getWsolBalance } from '@/service/solana/wrap-sol';
import { useConnection } from '@/hooks/use-connection';

export default function WrapSolForm() {
  const { publicKey, signTransaction } = useWallet();
  const connection = useConnection();
  const [wrapAmount, setWrapAmount] = useState('');
  const [isWrapping, setIsWrapping] = useState(false);
  const [isUnwrapping, setIsUnwrapping] = useState(false);
  const [solBalance, setSolBalance] = useState(0);
  const [wsolBalance, setWsolBalance] = useState(0);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const loadBalances = useCallback(async () => {
    if (!publicKey) return;

    setIsLoadingBalances(true);
    try {
      const sol = await connection.getBalance(publicKey);
      setSolBalance(sol / LAMPORTS_PER_SOL);

      const wsol = await getWsolBalance(publicKey);
      setWsolBalance(wsol);
    } catch (error) {
      console.error('Error loading balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (publicKey) {
      loadBalances();
    } else {
      setSolBalance(0);
      setWsolBalance(0);
    }
  }, [publicKey, loadBalances]);

  const handleWrap = async () => {
    if (!publicKey || !signTransaction || !wrapAmount) {
      toast.error('Please enter an amount');
      return;
    }

    const amount = parseFloat(wrapAmount);
    if (amount <= 0 || amount > solBalance) {
      toast.error('Invalid amount or exceeding available balance');
      return;
    }

    setIsWrapping(true);
    try {
      const result = await wrapSol(publicKey, signTransaction, amount);

      toast.success(`Wrapped ${amount} SOL successfully`, {
        description: `WSOL Address: ${result.wsolAddress.slice(0, 8)}...`,
        action: {
          label: 'View on Solscan',
          onClick: () =>
            window.open(`https://solscan.io/tx/${result.signature}?cluster=devnet`, '_blank'),
        },
      });

      setWrapAmount('');
      loadBalances();
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setIsWrapping(false);
    }
  };

  const handleUnwrap = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    if (wsolBalance === 0) {
      toast.error('You have no WSOL to unwrap');
      return;
    }

    setIsUnwrapping(true);
    try {
      const signature = await unwrapSol(publicKey, signTransaction);

      toast.success(`Unwrapped ${wsolBalance} WSOL successfully`, {
        action: {
          label: 'View on Solscan',
          onClick: () => window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, '_blank'),
        },
      });

      loadBalances();
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setIsUnwrapping(false);
    }
  };

  const setMaxWrap = () => {
    if (solBalance > 0.01) {
      setWrapAmount((solBalance - 0.01).toFixed(4));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownUp className="h-5 w-5" />
          Wrap / Unwrap SOL
        </CardTitle>
        <CardDescription>Convert between SOL and Wrapped SOL (WSOL)</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {publicKey && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">SOL Balance</p>
              <p className="text-lg font-semibold">
                {isLoadingBalances ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `${solBalance.toFixed(4)} SOL`
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">WSOL Balance</p>
              <p className="text-lg font-semibold">
                {isLoadingBalances ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `${wsolBalance.toFixed(4)} WSOL`
                )}
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="wrap" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wrap">Wrap SOL</TabsTrigger>
            <TabsTrigger value="unwrap">Unwrap SOL</TabsTrigger>
          </TabsList>

          <TabsContent value="wrap" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wrap-amount">Amount to wrap</Label>
              <div className="flex gap-2">
                <Input
                  id="wrap-amount"
                  type="number"
                  placeholder="Example: 1.5"
                  value={wrapAmount}
                  onChange={(e) => setWrapAmount(e.target.value)}
                  step="0.01"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={setMaxWrap}
                  disabled={!publicKey || solBalance === 0}
                >
                  Max
                </Button>
              </div>
            </div>

            <Button
              onClick={handleWrap}
              disabled={isWrapping || !wrapAmount || !publicKey}
              className="w-full"
            >
              {isWrapping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isWrapping ? 'Wrapping...' : 'Wrap SOL → WSOL'}
            </Button>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
              <p className="font-medium mb-1">What is wrapping?</p>
              <p className="text-xs text-muted-foreground">
                Wrapping SOL converts native SOL into Wrapped SOL (SPL Token), allowing it to be
                used in DeFi protocols and DEXs.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="unwrap" className="space-y-4">
            <div className="space-y-2">
              <Label>WSOL to unwrap</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{wsolBalance.toFixed(4)} WSOL</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All WSOL will be converted back to SOL
                </p>
              </div>
            </div>

            <Button
              onClick={handleUnwrap}
              disabled={isUnwrapping || wsolBalance === 0 || !publicKey}
              className="w-full"
              variant="secondary"
            >
              {isUnwrapping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUnwrapping ? 'Unwrapping...' : 'Unwrap WSOL → SOL'}
            </Button>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
              <p className="font-medium mb-1">What is unwrapping?</p>
              <p className="text-xs text-muted-foreground">
                Unwrapping closes the WSOL token account and returns all SOL back to your wallet.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {!publicKey && (
          <p className="text-sm text-center text-muted-foreground">
            Please connect your wallet to continue
          </p>
        )}
      </CardContent>
    </Card>
  );
}
