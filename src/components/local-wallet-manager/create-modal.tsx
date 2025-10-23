'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { generateSolanaWallet, getAddressLast4 } from '@/lib/wallet-service';
import type { WalletData } from '@/lib/wallet-service';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (wallets: WalletData[]) => void;
  password: string;
}

export default function CreateModal({ isOpen, onClose, onCreate, password }: CreateModalProps) {
  const [count, setCount] = useState(5);
  const [prefix, setPrefix] = useState('Wallet');
  const [suffix, setSuffix] = useState<'last4' | 'sequence'>('last4');
  const [isCreating, setIsCreating] = useState(false);

  const generatePreviewWallets = () => {
    const previews = [];
    for (let i = 0; i < Math.min(count, 5); i++) {
      const suffixValue = suffix === 'sequence' ? String(i + 1).padStart(4, '0') : 'a1b2';
      previews.push({
        name: `${prefix}_${suffixValue}`,
        index: i + 1,
      });
    }
    return previews;
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const newWallets: WalletData[] = [];

      for (let i = 0; i < count; i++) {
        const tempName = `${prefix}_temp${i}`;
        const wallet = generateSolanaWallet(tempName, password);
        const suffixValue =
          suffix === 'sequence'
            ? String(i + 1).padStart(4, '0')
            : getAddressLast4(wallet.publicKey);

        wallet.name = `${prefix}_${suffixValue}`;
        newWallets.push(wallet);
      }

      onCreate(newWallets);
    } catch (error) {
      console.error('Error creating wallets:', error);
      alert('Failed to create wallets. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Create Wallets</h2>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Number of Wallets (1-200)
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={count}
              onChange={(e) =>
                setCount(Math.min(200, Math.max(1, Number.parseInt(e.target.value) || 1)))
              }
              disabled={isCreating}
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Prefix (max 8 chars)
            </label>
            <input
              type="text"
              maxLength={8}
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              disabled={isCreating}
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Suffix Type</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="suffix"
                  value="last4"
                  checked={suffix === 'last4'}
                  onChange={() => setSuffix('last4')}
                  disabled={isCreating}
                  className="h-4 w-4 cursor-pointer accent-primary disabled:opacity-50"
                />
                <span className="text-sm text-foreground">SOL address last 4 digits</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="suffix"
                  value="sequence"
                  checked={suffix === 'sequence'}
                  onChange={() => setSuffix('sequence')}
                  disabled={isCreating}
                  className="h-4 w-4 cursor-pointer accent-primary disabled:opacity-50"
                />
                <span className="text-sm text-foreground">Sequence Number</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Preview (first 5)
            </label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-input bg-muted p-3">
              {generatePreviewWallets().map((wallet) => (
                <p key={wallet.index} className="font-mono text-xs text-foreground">
                  {wallet.name}
                </p>
              ))}
              {count > 5 && (
                <p className="text-xs text-muted-foreground italic">... and {count - 5} more</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="flex-1 rounded-lg border border-foreground bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
