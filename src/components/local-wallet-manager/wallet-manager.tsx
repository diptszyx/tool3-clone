'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import Header from '@/components/local-wallet-manager/header';
import WalletTable from '@/components/local-wallet-manager/wallet-table';
import CreateModal from '@/components/local-wallet-manager/create-modal';
import ImportModal from '@/components/local-wallet-manager/import-modal';
import PasswordModal from '@/components/local-wallet-manager/password-modal';
import ConfirmDeleteModal from '@/components/local-wallet-manager/confirm-delete-modal';
import SecurityHint from '@/components/local-wallet-manager/security-hint';
import { dbService } from '@/lib/indexeddb-service';
import { decryptPrivateKey } from '@/lib/wallet-service';
import type { WalletData } from '@/lib/wallet-service';
import bs58 from 'bs58';

export interface Wallet {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string;
  createdAt: Date;
}

export default function Home() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasWallets, setHasWallets] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordAction, setPasswordAction] = useState<
    'backup' | 'restore' | 'set' | 'verify' | null
  >(null);

  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkWalletsExist();
  }, []);

  const checkWalletsExist = async () => {
    try {
      await dbService.init();
      const walletsData = await dbService.getAllWallets();
      const exists = walletsData.length > 0;
      setHasWallets(exists);

      if (exists) {
        setPasswordAction('verify');
        setShowPasswordModal(true);
      } else {
        setIsUnlocked(false);
      }
    } catch (error) {
      console.error('Error checking wallets:', error);
      toast.error('Failed to check wallets');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWalletsFromDB = async (password: string) => {
    try {
      const walletsData = await dbService.getAllWallets();
      if (walletsData.length > 0) {
        try {
          decryptPrivateKey(walletsData[0].encryptedPrivateKey, password);
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
  };

  const handlePasswordSubmit = async (password: string) => {
    try {
      if (passwordAction === 'set') {
        setMasterPassword(password);
        setIsUnlocked(true);
        setHasWallets(false);
        setShowPasswordModal(false);
        toast.success('Master password set successfully!');
      } else if (passwordAction === 'verify') {
        await loadWalletsFromDB(password);
        setShowPasswordModal(false);
      } else if (passwordAction === 'backup') {
        const walletsData = await dbService.getAllWallets();
        const backupData = {
          wallets: walletsData,
          timestamp: new Date().toISOString(),
        };
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wallet-backup-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Backup created and downloaded');
        setShowPasswordModal(false);
      } else if (passwordAction === 'restore') {
        toast.info('Restore flow initiated');
        setShowPasswordModal(false);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || 'Invalid password');
      } else {
        toast.error('Invalid password');
      }
    }
  };

  const handleCreateWallets = async (newWalletsData: WalletData[]) => {
    try {
      await dbService.saveWallets(newWalletsData);

      const newWallets: Wallet[] = newWalletsData.map((w) => ({
        id: w.id,
        name: w.name,
        publicKey: w.publicKey,
        privateKey: '***encrypted***',
        createdAt: new Date(w.createdAt),
      }));

      setWallets([...wallets, ...newWallets]);
      setHasWallets(true);
      setShowCreateModal(false);
      toast.success(`Created ${newWallets.length} wallet(s)`);
    } catch (error) {
      console.error('Error saving wallets:', error);
      toast.error('Failed to save wallets');
    }
  };

  const handleImportWallets = (importedWallets: Wallet[], mode: 'append' | 'overwrite') => {
    if (mode === 'overwrite') {
      setWallets(importedWallets);
    } else {
      setWallets([...wallets, ...importedWallets]);
    }
    setShowImportModal(false);
    toast.success(`Imported ${importedWallets.length} wallet(s)`);
  };

  const handleDeleteClick = (wallet: Wallet) => {
    setWalletToDelete(wallet);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!walletToDelete) return;

    try {
      await dbService.deleteWallet(walletToDelete.id);
      setWallets(wallets.filter((w) => w.id !== walletToDelete.id));
      toast.info('Wallet deleted');
      if (wallets.length === 1) {
        setHasWallets(false);
        setIsUnlocked(false);
        setMasterPassword(null);
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast.error('Failed to delete wallet');
    } finally {
      setWalletToDelete(null);
    }
  };

  const handleRenameWallet = async (id: string, newName: string) => {
    try {
      const allWallets = await dbService.getAllWallets();
      const walletData = allWallets.find((w) => w.id === id);

      if (walletData) {
        walletData.name = newName;
        await dbService.updateWallet(walletData);

        setWallets(wallets.map((w) => (w.id === id ? { ...w, name: newName } : w)));
        toast.success(`Wallet renamed to "${newName}"`);
      }
    } catch (error) {
      console.error('Error renaming wallet:', error);
      toast.error('Failed to rename wallet');
    }
  };

  const handleCopyPrivateKey = async (walletId: string) => {
    if (!masterPassword) {
      toast.error('Password not available');
      return;
    }

    try {
      const walletsData = await dbService.getAllWallets();
      const walletData = walletsData.find((w) => w.id === walletId);

      if (walletData) {
        const privateKeyBytes = decryptPrivateKey(walletData.encryptedPrivateKey, masterPassword);
        const privateKeyBase58 = bs58.encode(privateKeyBytes);

        await navigator.clipboard.writeText(privateKeyBase58);
        toast.warning('🔑 Private key copied to clipboard - keep it safe!');
      }
    } catch (error) {
      console.error('Error copying private key:', error);
      toast.error('Failed to copy private key');
    }
  };

  const handleBackup = () => {
    setPasswordAction('backup');
    setShowPasswordModal(true);
  };

  const handleRestore = () => {
    setPasswordAction('restore');
    setShowPasswordModal(true);
  };

  const handleSetPassword = () => {
    setPasswordAction('set');
    setShowPasswordModal(true);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!hasWallets && !isUnlocked) {
    return (
      <main className="min-h-screen bg-background">
        <Header onBackup={handleBackup} onRestore={handleRestore} isUnlocked={isUnlocked} />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <SecurityHint />
          </div>

          <div className="flex flex-col items-center justify-center py-20">
            <Lock className="h-16 w-16 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Wallet Manager</h2>
            <p className="text-muted-foreground mb-8 text-center max-w-md">
              To get started, please set a master password to secure your wallets.
            </p>
            <button
              onClick={handleSetPassword}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Set Master Password
            </button>
          </div>
        </div>

        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
          action={passwordAction}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header onBackup={handleBackup} onRestore={handleRestore} isUnlocked={isUnlocked} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <SecurityHint />
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!isUnlocked}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              + Create Wallets
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              disabled={!isUnlocked}
              className="rounded-lg border border-foreground bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Import Wallets
            </button>
          </div>

          <WalletTable
            wallets={wallets}
            onDelete={handleDeleteClick}
            onRename={handleRenameWallet}
            onCopyPrivateKey={handleCopyPrivateKey}
          />
        </div>
      </div>

      {masterPassword && (
        <CreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWallets}
          password={masterPassword}
        />
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportWallets}
      />

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          if (passwordAction === 'verify' && !isUnlocked) {
            toast.info('You need to verify your password to access wallets');
          }
        }}
        onSubmit={handlePasswordSubmit}
        action={passwordAction}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setWalletToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        walletName={walletToDelete?.name || ''}
      />
    </main>
  );
}
