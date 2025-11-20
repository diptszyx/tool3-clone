import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { WalletMigration } from '@/types/types';
import { executeSingleWalletMigration } from '@/lib/migration-service';
import { executeMultiWalletMigration } from '@/lib/multi-wallet-migration-service';
import { dbService } from '@/lib/indexeddb-service';
import { decryptPrivateKey } from '@/lib/wallet-service';
import bs58 from 'bs58';
import { getSavedInviteCode } from '@/lib/invite-codes/helpers';

interface UseMigrationProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface SingleWalletResult {
  success: boolean;
  tokensTransferred: number;
  signature?: string;
  error?: string;
}

interface MultiWalletResult {
  success: boolean;
  totalWallets: number;
  successfulWallets: number;
  failedWallets: number;
  signatures: string[];
  errors: Array<{ wallet: string; error: string }>;
}

export function useMigration({ onSuccess, onError }: UseMigrationProps = {}) {
  const [migrationInProgress, setMigrationInProgress] = useState(false);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const saved = getSavedInviteCode();
  const inviteCode = saved?.code;

  const migrateSingleWallet = useCallback(
    async (
      wallet: WalletMigration,
      destinationAddress: string,
      includeSol: boolean,
    ): Promise<SingleWalletResult> => {
      setMigrationInProgress(true);
      const loadingToast = toast.loading('Preparing migration...');

      try {
        const result = await executeSingleWalletMigration({
          wallet,
          destinationAddress,
          includeSol,
          inviteCode,
        });

        toast.dismiss(loadingToast);

        if (result.success) {
          if (onSuccess) onSuccess();
          return result;
        } else {
          toast.error('Migration failed', {
            description: result.error,
            duration: 7000,
          });

          if (onError) {
            onError(new Error(result.error || 'Migration failed'));
          }
          return result;
        }
      } catch (error) {
        toast.dismiss(loadingToast);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error('Migration error', {
          description: errorMessage,
          duration: 7000,
        });

        if (onError) {
          onError(error as Error);
        }
        throw error;
      } finally {
        setMigrationInProgress(false);
      }
    },
    [onSuccess, onError, inviteCode],
  );

  const migrateMultipleWallets = useCallback(
    async (
      wallets: WalletMigration[],
      destinationAddress: string,
      includeSol: boolean,
    ): Promise<MultiWalletResult> => {
      if (!masterPassword) {
        toast.error('Password not available. Please re-import wallets.');
        throw new Error('Password not available');
      }

      setMigrationInProgress(true);
      const loadingToast = toast.loading('Preparing multi-wallet migration...');

      try {
        await dbService.init();
        const walletsData = await dbService.getAllWallets();
        const privateKeys: Record<string, string> = {};
        const selectedWallets = wallets.filter((w) => w.selected);

        for (const wallet of selectedWallets) {
          const walletData = walletsData.find((wd) => wd.publicKey === wallet.address);

          if (!walletData) {
            throw new Error(`Wallet ${wallet.address} not found`);
          }

          const privateKeyBytes = decryptPrivateKey(
            walletData.encryptedPrivateKey,
            masterPassword,
            walletData.salt,
            walletData.iv,
          );
          privateKeys[wallet.address] = bs58.encode(privateKeyBytes);
        }

        toast.dismiss(loadingToast);
        const migrationToast = toast.loading('Migrating wallets...');

        const result = await executeMultiWalletMigration({
          wallets,
          destinationAddress,
          includeSol,
          privateKeys,
          inviteCode,
          onProgress: (current, total, status) => {
            toast.loading(`${status} (${current}/${total})`, { id: migrationToast });
          },
        });

        toast.dismiss(migrationToast);

        setMasterPassword(null);

        if (result.success) {
          if (onSuccess) onSuccess();
          return result;
        } else {
          if (onError) {
            onError(new Error('Migration completed with errors'));
          }
          return result;
        }
      } catch (error) {
        toast.dismiss(loadingToast);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error('Migration error', {
          description: errorMessage,
          duration: 7000,
        });

        setMasterPassword(null);

        if (onError) {
          onError(error as Error);
        }
        throw error;
      } finally {
        setMigrationInProgress(false);
      }
    },
    [masterPassword, onSuccess, onError, inviteCode],
  );

  return {
    migrationInProgress,
    masterPassword,
    setMasterPassword,
    migrateSingleWallet,
    migrateMultipleWallets,
  };
}
