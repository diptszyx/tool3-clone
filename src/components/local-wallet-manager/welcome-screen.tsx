'use client';

import { Lock } from 'lucide-react';
import SecurityHint from './security-hint';

interface WelcomeScreenProps {
  onSetPassword: () => void;
}

export default function WelcomeScreen({ onSetPassword }: WelcomeScreenProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <SecurityHint />
      </div>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-muted p-4 mb-6">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Wallet Manager</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          To get started, please set a master password to secure your wallets.
        </p>

        <button
          onClick={onSetPassword}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          Set Master Password
        </button>
      </div>
    </div>
  );
}
