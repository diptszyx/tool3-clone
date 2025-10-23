'use client';

interface HeaderProps {
  onBackup: () => void;
  isUnlocked: boolean;
}

export default function Header({ onBackup, isUnlocked }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Wallet Manager</h1>
          <button
            onClick={onBackup}
            disabled={!isUnlocked}
            className="rounded-lg border border-foreground bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Backup
          </button>
        </div>
      </div>
    </header>
  );
}
