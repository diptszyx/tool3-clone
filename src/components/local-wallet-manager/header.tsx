'use client';

import { Download, Upload } from 'lucide-react';

interface HeaderProps {
  onBackup: () => void;
  onRestore: () => void;
  isUnlocked?: boolean;
}

export default function Header({ onBackup, onRestore, isUnlocked = false }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Local Wallet Manager</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your crypto wallets securely on your device
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onBackup}
              disabled={!isUnlocked}
              className="inline-flex items-center gap-2 rounded-lg border border-foreground bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Backup
            </button>
            <button
              onClick={onRestore}
              disabled={!isUnlocked}
              className="inline-flex items-center gap-2 rounded-lg border border-foreground bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              Restore
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
