import { useState, useCallback, useEffect } from "react";
import {
  generateSolanaWallets,
  saveWalletsToLocalStorage,
  loadWalletsFromLocalStorage,
  removeWalletsFromLocalStorage,
} from "@/utils/create-wallets";
import { WalletInfo } from "@/lib/increase/types";

export const useWalletManager = () => {
  const [wallets, setWallets] = useState<WalletInfo[] | null>(null);

  useEffect(() => {
    const saved = loadWalletsFromLocalStorage();
    if (saved) {
      setWallets(saved);
    }
  }, []);

  const generateWallets = useCallback(
    (
      quantity: number,
      mode: "fixed" | "random",
      fixedAmount?: number,
      minAmount?: number,
      maxAmount?: number
    ): WalletInfo[] => {
      const newWallets =
        mode === "fixed"
          ? generateSolanaWallets(quantity, "fixed", fixedAmount!)
          : generateSolanaWallets(quantity, "random", minAmount!, maxAmount!);

      setWallets(newWallets);
      return newWallets;
    },
    []
  );

  const saveWallets = useCallback((walletsToSave: WalletInfo[]) => {
    saveWalletsToLocalStorage(walletsToSave);
    setWallets(walletsToSave);
  }, []);

  const clearWallets = useCallback(() => {
    removeWalletsFromLocalStorage();
    setWallets(null);
  }, []);

  return {
    wallets,
    generateWallets,
    saveWallets,
    clearWallets,
  };
};
