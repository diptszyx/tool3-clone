'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, ArrowDownUp } from 'lucide-react';
import { wrapSol, unwrapSol, getWsolBalance } from '@/service/solana/wrap-sol';
import { useConnection } from '@/hooks/use-connection';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNetwork } from '@/context/NetworkContext';

export default function WrapSolForm() {
  const isMobile = useIsMobile();
  const { publicKey, signTransaction } = useWallet();
  const connection = useConnection();
  const [wrapAmount, setWrapAmount] = useState('');
  const [isWrapping, setIsWrapping] = useState(false);
  const [isUnwrapping, setIsUnwrapping] = useState(false);
  const [solBalance, setSolBalance] = useState(0);
  const [wsolBalance, setWsolBalance] = useState(0);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const { network } = useNetwork();

  const loadBalances = useCallback(async () => {
    if (!publicKey) return;

    setIsLoadingBalances(true);
    try {
      const sol = await connection.getBalance(publicKey);
      setSolBalance(sol / LAMPORTS_PER_SOL);

      const wsol = await getWsolBalance(publicKey, connection);
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
      const result = await wrapSol(publicKey, signTransaction, amount, connection);

      toast.success(`Wrapped ${amount} SOL successfully`, {
        description: `WSOL Address: ${result.wsolAddress.slice(0, 8)}...`,
        action: {
          label: 'View on Solscan',
          onClick: () => {
            const solscanTxUrl =
              network === 'devnet'
                ? `https://solscan.io/tx/${result.signature}?cluster=devnet`
                : `https://solscan.io/tx/${result.signature}`;

            window.open(solscanTxUrl, '_blank');
          },
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
      const signature = await unwrapSol(publicKey, signTransaction, connection);

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
    <div
      className={`md:p-2 max-w-[550px] mx-auto my-2 flex flex-col items-center ${
        !isMobile && 'border-gear'
      }`}
    >
      <div className="w-full space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-black flex items-center justify-center gap-2">
            <ArrowDownUp className="h-5 w-5" />
            Wrap / Unwrap SOL
          </h1>
          <p className="text-sm text-gray-700 mt-2">Convert between SOL and Wrapped SOL (WSOL)</p>
        </div>

        {publicKey && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 border-2 border-gray-300 rounded-lg w-[calc(100%-10px)] mx-auto">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">SOL Balance</p>
              <p className="text-lg font-bold text-black">
                {isLoadingBalances ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `${solBalance.toFixed(4)} SOL`
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">WSOL Balance</p>
              <p className="text-lg font-bold text-black">
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
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger
              value="wrap"
              className="data-[state=active]:bg-white data-[state=active]:text-black font-semibold"
            >
              Wrap SOL
            </TabsTrigger>
            <TabsTrigger
              value="unwrap"
              className="data-[state=active]:bg-white data-[state=active]:text-black font-semibold"
            >
              Unwrap SOL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wrap" className="space-y-6">
            <div className="px-[5px] space-y-6">
              <div className="space-y-2">
                <Label htmlFor="wrap-amount" className="text-black font-semibold">
                  Amount to wrap
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="wrap-amount"
                    type="number"
                    placeholder="Example: 1.5"
                    value={wrapAmount}
                    onChange={(e) => setWrapAmount(e.target.value)}
                    step="0.01"
                    className="border-2 border-gray-300 bg-white text-black font-medium focus:border-black focus:ring-2 focus:ring-gray-300 rounded-lg !h-[30px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={setMaxWrap}
                    disabled={!publicKey || solBalance === 0}
                    className="!h-[30px] border-2 border-gray-300 hover:bg-gray-100 font-semibold"
                  >
                    Max
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border-2 border-gray-300 rounded-lg">
                <p className="font-bold mb-1 text-black text-sm">What is wrapping?</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Wrapping SOL converts native SOL into Wrapped SOL (SPL Token), allowing it to be
                  used in DeFi protocols and DEXs.
                </p>
              </div>
            </div>

            <Button
              onClick={handleWrap}
              disabled={isWrapping || !wrapAmount || !publicKey}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 rounded-lg transition-colors duration-200 disabled:bg-gray-400"
              variant="default"
            >
              {isWrapping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isWrapping ? 'Wrapping...' : 'Wrap SOL → WSOL'}
            </Button>
          </TabsContent>

          <TabsContent value="unwrap" className="space-y-6">
            <div className="px-[5px] space-y-6">
              <div className="space-y-2">
                <Label className="text-black font-semibold">WSOL to unwrap</Label>
                <div className="p-3 bg-gray-50 border-2 border-gray-300 rounded-lg">
                  <p className="text-2xl font-bold text-black">{wsolBalance.toFixed(4)} WSOL</p>
                  <p className="text-xs text-gray-700 mt-1">
                    All WSOL will be converted back to SOL
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border-2 border-gray-300 rounded-lg">
                <p className="font-bold mb-1 text-black text-sm">What is unwrapping?</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Unwrapping closes the WSOL token account and returns all SOL back to your wallet.
                </p>
              </div>
            </div>

            <Button
              onClick={handleUnwrap}
              disabled={isUnwrapping || wsolBalance === 0 || !publicKey}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded-lg transition-colors duration-200 disabled:bg-gray-400"
              variant="secondary"
            >
              {isUnwrapping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUnwrapping ? 'Unwrapping...' : 'Unwrap WSOL → SOL'}
            </Button>
          </TabsContent>
        </Tabs>

        {!publicKey && (
          <p className="text-sm text-center text-gray-700 font-medium mt-6">
            Please connect your wallet to continue
          </p>
        )}
      </div>
    </div>
  );
}
