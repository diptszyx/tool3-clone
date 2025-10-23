'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Header from '@/components/local-wallet-manager/header';
import WalletTable from '@/components/local-wallet-manager/wallet-table';
import CreateModal from '@/components/local-wallet-manager/create-modal';
import ImportModal from '@/components/local-wallet-manager/import-modal';
import PasswordModal from '@/components/local-wallet-manager/password-modal';
import ConfirmDeleteModal from '@/components/local-wallet-manager/confirm-delete-modal';
import ResetWalletModal from '@/components/local-wallet-manager/reset-wallet-modal';
import WelcomeScreen from '@/components/local-wallet-manager/welcome-screen';
import LockedWalletScreen from '@/components/local-wallet-manager/locked-wallet-screen';
import SecurityHint from '@/components/local-wallet-manager/security-hint';
import { useWalletManager } from '@/hooks/use-wallet-manager';
import type { WalletData } from '@/lib/wallet-service';

export interface Wallet {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string;
  createdAt: Date;
}

export default function Home() {
  const {
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
  } = useWalletManager();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'set' | 'verify' | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);

  const initializeApp = useCallback(async () => {
    const exists = await checkWalletsExist();
    if (exists) {
      setPasswordAction('verify');
      setShowPasswordModal(true);
    }
  }, [checkWalletsExist]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handlePasswordSubmit = async (password: string) => {
    try {
      if (passwordAction === 'set') {
        setMasterPassword(password);
        setIsUnlocked(true);
        setShowPasswordModal(false);
        toast.success('Master password set successfully!');
      } else if (passwordAction === 'verify') {
        await loadWallets(password);
        setShowPasswordModal(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid password');
    }
  };

  const handleSetPassword = () => {
    setPasswordAction('set');
    setShowPasswordModal(true);
  };

  const handleUnlockClick = () => {
    setPasswordAction('verify');
    setShowPasswordModal(true);
  };

  const handleBackup = async () => {
    if (!masterPassword) {
      toast.error('Please unlock your wallet first');
      return;
    }
    await backupWallets(masterPassword);
  };

  const handleCreateWallets = async (newWalletsData: WalletData[]) => {
    await createWallets(newWalletsData);
    setShowCreateModal(false);
  };

  const handleImportWallets = async (importedWallets: Wallet[], mode: 'append' | 'overwrite') => {
    if (!masterPassword) {
      toast.error('Master password not available');
      return;
    }
    await importWallets(importedWallets, mode, masterPassword);
    setShowImportModal(false);
  };

  const handleDeleteClick = (wallet: Wallet) => {
    setWalletToDelete(wallet);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (walletToDelete) {
      await deleteWallet(walletToDelete.id);
      setWalletToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleCopyPrivateKey = async (walletId: string) => {
    if (!masterPassword) {
      toast.error('Password not available');
      return;
    }
    await copyPrivateKey(walletId, masterPassword);
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
        <Header onBackup={handleBackup} isUnlocked={isUnlocked} />
        <WelcomeScreen onSetPassword={handleSetPassword} />
        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
          action={passwordAction}
        />
      </main>
    );
  }

  if (hasWallets && !isUnlocked) {
    return (
      <main className="min-h-screen bg-background">
        <Header onBackup={handleBackup} isUnlocked={isUnlocked} />
        <LockedWalletScreen onUnlock={handleUnlockClick} onReset={() => setShowResetModal(true)} />

        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
          action={passwordAction}
        />

        <ResetWalletModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onConfirm={resetAllData}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header onBackup={handleBackup} isUnlocked={isUnlocked} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <SecurityHint />
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!isUnlocked}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
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
            onRename={renameWallet}
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
        onClose={() => setShowPasswordModal(false)}
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
