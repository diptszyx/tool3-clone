'use client';

import { AlertTriangle } from 'lucide-react';

interface ResetWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResetWalletModal({ isOpen, onClose, onConfirm }: ResetWalletModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-background border border-border p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-destructive/10 p-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Reset All Data</h2>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-muted-foreground">
            This action will <strong className="text-foreground">permanently delete</strong> all
            your encrypted wallets from this device.
          </p>

          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm text-destructive font-medium mb-2">
              Warning: This cannot be undone!
            </p>
            <ul className="text-sm text-destructive space-y-1 list-disc list-inside">
              <li>All wallets will be deleted</li>
              <li>Your master password will be cleared</li>
              <li>You must have backed up your private keys</li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Make sure you have saved your private keys before proceeding.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}
