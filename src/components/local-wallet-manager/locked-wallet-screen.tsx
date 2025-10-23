'use client';

import { KeyRound } from 'lucide-react';
import SecurityHint from './security-hint';

interface LockedWalletScreenProps {
  onUnlock: () => void;
  onReset: () => void;
}

export default function LockedWalletScreen({ onUnlock, onReset }: LockedWalletScreenProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <SecurityHint />
      </div>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-muted p-4 mb-6">
          <KeyRound className="h-12 w-12 text-muted-foreground" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">Wallet Locked</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          Your wallets are encrypted and locked. Enter your master password to unlock and access
          them.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={onUnlock}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Unlock Wallet
          </button>

          <button
            onClick={onReset}
            className="rounded-lg border border-destructive/30 text-destructive px-6 py-3 text-sm font-medium hover:bg-destructive/10 transition-colors"
          >
            Forgot Password? Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}
