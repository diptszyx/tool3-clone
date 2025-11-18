import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { dbService } from '@/lib/indexeddb-service';
import { decryptPrivateKey, encryptPrivateKey } from '@/lib/wallet-service';
import { SECURITY_CONFIG } from '@/lib/security-config';
import type { WalletData } from '@/lib/wallet-service';
import type { Wallet } from '@/components/local-wallet-manager/wallet-manager';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

export function useWalletManager() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasWallets, setHasWallets] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    if (isUnlocked) {
      autoLockTimerRef.current = setTimeout(() => {
        setIsUnlocked(false);
        setMasterPassword(null);
        toast.info('Session locked due to inactivity');
      }, SECURITY_CONFIG.AUTO_LOCK_TIMEOUT_MS);
    }
  }, [isUnlocked]);

  useEffect(() => {
    if (isUnlocked) {
      resetAutoLockTimer();
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      const handleActivity = () => resetAutoLockTimer();
      events.forEach((event) => window.addEventListener(event, handleActivity));
      return () => {
        events.forEach((event) => window.removeEventListener(event, handleActivity));
        if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
      };
    }
  }, [isUnlocked, resetAutoLockTimer]);

  const checkWalletsExist = useCallback(async () => {
    try {
      await dbService.init();
      const walletsData = await dbService.getAllWallets();
      const exists = walletsData.length > 0;
      setHasWallets(exists);
      return exists;
    } catch (error) {
      console.error('Error checking wallets:', error);
      toast.error('Failed to check wallets');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadWallets = useCallback(async (password: string) => {
    try {
      const walletsData = await dbService.getAllWallets();
      if (walletsData.length > 0) {
        try {
          decryptPrivateKey(
            walletsData[0].encryptedPrivateKey,
            password,
            walletsData[0].salt,
            walletsData[0].iv,
          );
        } catch {
          throw new Error('Invalid password');
        }
      }
      const loadedWallets: Wallet[] = walletsData.map((w) => ({
        id: w.id,
        name: w.name,
        publicKey: w.publicKey,
        privateKey: '***encrypted***',
        createdAt: new Date(w.createdAt),
      }));
      setWallets(loadedWallets);
      setMasterPassword(password);
      setIsUnlocked(true);
      toast.success('Wallets unlocked successfully');
    } catch (error) {
      console.error('Error loading wallets:', error);
      throw error;
    }
  }, []);

  const createWallets = useCallback(async (newWalletsData: WalletData[]) => {
    try {
      await dbService.saveWallets(newWalletsData);
      const newWallets: Wallet[] = newWalletsData.map((w) => ({
        id: w.id,
        name: w.name,
        publicKey: w.publicKey,
        privateKey: '***encrypted***',
        createdAt: new Date(w.createdAt),
      }));
      setWallets((prev) => [...prev, ...newWallets]);
      setHasWallets(true);
      toast.success(`Created ${newWallets.length} wallet(s)`);
    } catch (error) {
      console.error('Error saving wallets:', error);
      toast.error('Failed to save wallets');
    }
  }, []);

  const importWallets = useCallback(
    async (importedWallets: Wallet[], mode: 'append' | 'overwrite', password: string) => {
      try {
        const walletsData: WalletData[] = await Promise.all(
          importedWallets.map(async (w) => {
            try {
              const privateKeyBytes = bs58.decode(w.privateKey);
              if (privateKeyBytes.length !== 64)
                throw new Error(`Invalid private key length for "${w.name}"`);
              const keypair = Keypair.fromSecretKey(privateKeyBytes);
              const publicKey = keypair.publicKey.toBase58();
              const { encrypted, salt, iv } = encryptPrivateKey(privateKeyBytes, password);
              return {
                id: w.id,
                name: w.name,
                publicKey,
                encryptedPrivateKey: encrypted,
                salt,
                iv,
                createdAt: w.createdAt.toISOString(),
              };
            } catch (error) {
              throw new Error(
                `Invalid private key for wallet "${w.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
              );
            }
          }),
        );

        if (mode === 'overwrite') {
          const existingWallets = await dbService.getAllWallets();
          await Promise.all(existingWallets.map((w) => dbService.deleteWallet(w.id)));
        }

        await dbService.saveWallets(walletsData);

        const newWallets: Wallet[] = walletsData.map((w) => ({
          id: w.id,
          name: w.name,
          publicKey: w.publicKey,
          privateKey: '***encrypted***',
          createdAt: new Date(w.createdAt),
        }));

        setWallets(mode === 'overwrite' ? newWallets : (prev) => [...prev, ...newWallets]);
        setHasWallets(true);
        toast.success(`Imported ${newWallets.length} wallet(s) successfully`);
      } catch (error) {
        console.error('Error importing wallets:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to import wallets');
      }
    },
    [],
  );

  const deleteWallet = useCallback(async (walletId: string) => {
    try {
      await dbService.deleteWallet(walletId);
      setWallets((prev) => {
        const updated = prev.filter((w) => w.id !== walletId);
        if (updated.length === 0) {
          setHasWallets(false);
          setIsUnlocked(false);
          setMasterPassword(null);
        }
        return updated;
      });
      toast.info('Wallet deleted');
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast.error('Failed to delete wallet');
    }
  }, []);

  const renameWallet = useCallback(async (id: string, newName: string) => {
    try {
      const allWallets = await dbService.getAllWallets();
      const walletData = allWallets.find((w) => w.id === id);
      if (walletData) {
        walletData.name = newName;
        await dbService.updateWallet(walletData);
        setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, name: newName } : w)));
        toast.success(`Wallet renamed to "${newName}"`);
      }
    } catch (error) {
      console.error('Error renaming wallet:', error);
      toast.error('Failed to rename wallet');
    }
  }, []);

  const copyPrivateKey = useCallback(async (walletId: string, password: string) => {
    try {
      const walletsData = await dbService.getAllWallets();
      const walletData = walletsData.find((w) => w.id === walletId);
      if (walletData) {
        const privateKeyBytes = decryptPrivateKey(
          walletData.encryptedPrivateKey,
          password,
          walletData.salt,
          walletData.iv,
        );
        const privateKeyBase58 = bs58.encode(privateKeyBytes);
        await navigator.clipboard.writeText(privateKeyBase58);
        toast.warning('Private key copied to clipboard - keep it safe!');
      }
    } catch (error) {
      console.error('Error copying private key:', error);
      toast.error('Failed to copy private key');
    }
  }, []);

  const backupWallets = useCallback(async (password: string) => {
    try {
      const walletsData = await dbService.getAllWallets();
      const privateKeys = walletsData.map((w) => {
        const privateKeyBytes = decryptPrivateKey(w.encryptedPrivateKey, password, w.salt, w.iv);
        return bs58.encode(privateKeyBytes);
      });
      const dataStr = JSON.stringify(privateKeys, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wallet-backup-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Backed up ${privateKeys.length} wallet(s)`);
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    }
  }, []);

  const resetAllData = useCallback(async () => {
    try {
      const allWallets = await dbService.getAllWallets();
      await Promise.all(allWallets.map((w) => dbService.deleteWallet(w.id)));
      setWallets([]);
      setHasWallets(false);
      setIsUnlocked(false);
      setMasterPassword(null);
      toast.success('All data cleared successfully. You can now start fresh.');
    } catch (error) {
      console.error('Error resetting wallets:', error);
      toast.error('Failed to reset data');
    }
  }, []);

  return {
    wallets,
    masterPassword,
    isUnlocked,
    hasWallets,
    isLoading,
    checkWalletsExist,
    loadWallets,
    createWallets,
    importWallets,
    deleteWallet,
    renameWallet,
    copyPrivateKey,
    backupWallets,
    resetAllData,
    setMasterPassword,
    setIsUnlocked,
  };
}
