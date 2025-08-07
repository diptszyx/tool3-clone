"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart3 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair } from "@solana/web3.js";
import TokenSearchModal from "@/components/increase/search-token";
import { useWalletManager } from "@/hooks/increase/useWalletManager";
import { useQuoteValidation } from "@/hooks/increase/useQuoteValidation";
import { WalletTable } from "@/components/increase/wallet-table";
import { TokenConfiguration } from "@/components/increase/token-configuration";
import { PurchaseSettings } from "@/components/increase/purchase-settings";
import { DEXSelector } from "@/components/increase/dex-selector";
import { QuantitySelector } from "@/components/increase/quantity-selector";
import { StatsCards } from "@/components/increase/stats-cards";
import { ActionButtons } from "@/components/increase/action-buttons";
import { exportWalletsToExcel } from "@/utils/wallet-export";
import { buildAirdropTransactions } from "@/lib/increase/airdrop";
import { createConnection } from "@/lib/increase/rpc";
import { fetchSolAndTokenBalancesBatched } from "@/utils/increase/check-wallets";
import {
  FormData,
  DEFAULT_TOKEN,
  TokenInfo,
  WalletInfo,
  FORM_SCHEMA,
} from "@/lib/increase/types";

export default function IncreaseHolderForm() {
  const isMobile = useIsMobile();
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(
    DEFAULT_TOKEN
  );
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey, signTransaction } = useWallet();

  const { wallets, generateWallets, saveWallets, clearWallets } =
    useWalletManager();
  const { validateQuote } = useQuoteValidation();

  const form = useForm<FormData>({
    resolver: zodResolver(FORM_SCHEMA),
    defaultValues: {
      rpcUrl: "",
      buyAmountMode: "fixed",
      fixedAmount: "0.001",
      randomMin: "0.001",
      randomMax: "0.01",
      autoSell: false,
      dexType: "Raydium,Meteora,Orca+V2",
      quantity: "50",
      customQuantity: "",
    },
  });

  const watchedQuantity = form.watch("quantity");
  const watchedCustomQuantity = form.watch("customQuantity");
  const dexType = form.watch("dexType");

  const showNewRun = !!(!isLoading && wallets && wallets.length > 0);
  const isFormDisabled = showNewRun || isLoading;
  const displayQuantity = watchedCustomQuantity || watchedQuantity;

  useEffect(() => {
    if (selectedToken && dexType && !isFormDisabled) {
      const timeoutId = setTimeout(() => {
        validateQuote(selectedToken.id, dexType);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedToken, dexType, isFormDisabled, validateQuote]);

  const handleNewRun = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    clearWallets();
  };

  const handleDownloadWallets = () => {
    if (!wallets || wallets.length === 0) {
      toast.error("No wallets to download. Please run first.");
      return;
    }
    exportWalletsToExcel(wallets);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const qty =
        data.customQuantity && !isNaN(Number(data.customQuantity))
          ? parseInt(data.customQuantity)
          : parseInt(data.quantity);

      if (!qty || qty <= 0) {
        throw new Error("Please enter a valid quantity");
      }

      if (data.buyAmountMode === "fixed") {
        const amount = parseFloat(data.fixedAmount || "0");
        if (!amount || amount <= 0) {
          throw new Error("Please enter a valid fixed SOL amount");
        }
      } else {
        const min = parseFloat(data.randomMin || "0");
        const max = parseFloat(data.randomMax || "0");
        if (!min || !max || min <= 0 || max <= 0 || min > max) {
          throw new Error(
            "Please enter valid random SOL amounts (min should be less than max)"
          );
        }
      }

      if (!publicKey || !signTransaction) {
        toast.error("Wallet not connected");
        setIsLoading(false);
        return;
      }

      const adminWallet: WalletInfo = {
        keypair: Keypair.generate(),
        publicKey: publicKey.toBase58(),
        secretKey: "",
        solAmount: 0,
        transferAmount: 0,
      };

      let currentWallets = wallets;

      if (!currentWallets || currentWallets.length !== qty) {
        if (data.buyAmountMode === "fixed") {
          const amount = parseFloat(data.fixedAmount || "0");
          currentWallets = generateWallets(qty, "fixed", amount);
        } else {
          const min = parseFloat(data.randomMin || "0");
          const max = parseFloat(data.randomMax || "0");
          currentWallets = generateWallets(qty, "random", min, max);
        }
      }

      const fullList = [adminWallet, ...currentWallets];
      if (!selectedToken) {
        throw new Error("Please select the token you want to use.");
      }

      const connection = createConnection(data.rpcUrl);

      const { initialTransaction, childTransactions } =
        await buildAirdropTransactions(
          publicKey,
          fullList,
          connection,
          selectedToken?.id,
          [data.dexType]
        );

      const signedTx = await signTransaction(initialTransaction);
      const sig1 = await connection.sendTransaction(signedTx);
      await connection.confirmTransaction(sig1, "confirmed");

      for (let i = 0; i < childTransactions.length; i++) {
        const child = childTransactions[i];

        try {
          const signed = await connection.sendTransaction(child.transaction);
          await connection.confirmTransaction(signed, "confirmed");

          const walletIndex = child.walletIndex - 1;
          if (walletIndex >= 0 && walletIndex < currentWallets.length) {
            currentWallets[walletIndex].result = "success";
          }
        } catch {
          const walletIndex = child.walletIndex - 1;
          if (walletIndex >= 0 && walletIndex < currentWallets.length) {
            currentWallets[walletIndex].result = "failed";
          }
        }
      }

      await new Promise((r) => setTimeout(r, 2000));

      const updatedWallets = await fetchSolAndTokenBalancesBatched(
        currentWallets,
        connection
      );
      const finalWallets = updatedWallets.map((w, idx) => ({
        ...w,
        result: currentWallets[idx].result,
      }));

      saveWallets(finalWallets);

      toast.success("Success!", {
        action: {
          label: "View on Solscan",
          onClick: () => window.open(`https://solscan.io/tx/${sig1}`, "_blank"),
        },
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while processing the transaction.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto my-2 md:p-2">
      <div className="min-h-screen">
        <div
          className={`max-h-[calc(100vh-100px)] overflow-y-auto px-4 ${
            isMobile ? "py-2" : "py-6"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-8 w-8 text-black" />
              <h1 className="text-3xl font-bold text-gray-900">
                SOL Increase Holders
              </h1>
            </div>
            <p className="text-gray-600 mb-6 max-w-4xl">
              Quickly increase the number of new wallet Buy (↑MAKERS) and token
              holders for a specified token by automatically creating new wallet
              addresses, helping your project data stand out on DEX.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <WalletTable
                    wallets={wallets}
                    selectedToken={selectedToken}
                  />

                  <TokenConfiguration
                    selectedToken={selectedToken}
                    onSelectToken={() => setTokenModalOpen(true)}
                    form={form}
                    disabled={isFormDisabled}
                  />

                  <PurchaseSettings form={form} disabled={isFormDisabled} />

                  <DEXSelector form={form} disabled={isFormDisabled} />
                </div>

                <div className="space-y-6">
                  <QuantitySelector form={form} disabled={isFormDisabled} />

                  <StatsCards quantity={displayQuantity} />

                  <ActionButtons
                    isLoading={isLoading}
                    showNewRun={showNewRun}
                    onDownload={handleDownloadWallets}
                    onNewRun={handleNewRun}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>

      <TokenSearchModal
        open={tokenModalOpen && !isFormDisabled}
        onClose={() => setTokenModalOpen(false)}
        onSelect={(token) => {
          if (!isFormDisabled) {
            setSelectedToken(token);
            setTokenModalOpen(false);
          }
        }}
      />
    </div>
  );
}
