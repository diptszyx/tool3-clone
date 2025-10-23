'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Trash2, Edit2, Check, X, Key } from 'lucide-react';
import type { Wallet } from '@/components/local-wallet-manager/wallet-manager';

interface WalletTableProps {
  wallets: Wallet[];
  onDelete: (wallet: Wallet) => void;
  onRename: (id: string, newName: string) => void;
  onCopyPrivateKey: (id: string) => void;
}

export default function WalletTable({
  wallets,
  onDelete,
  onRename,
  onCopyPrivateKey,
}: WalletTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const shortenKey = (key: string) => {
    if (key.length <= 20) return key;
    return `${key.slice(0, 10)}...${key.slice(-10)}`;
  };

  const handleCopyPublicKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success('Public key copied to clipboard');
    } catch {
      toast.error('Failed to copy public key');
    }
  };

  const handleStartEdit = (wallet: Wallet) => {
    setEditingId(wallet.id);
    setEditingName(wallet.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      onRename(id, editingName);
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  if (wallets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">No wallets yet. Create wallets to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted">
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
              Public Key
            </th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((wallet, index) => (
            <tr
              key={wallet.id}
              className={`border-b border-border transition-colors hover:bg-muted ${
                index % 2 === 0 ? 'bg-background' : 'bg-card'
              }`}
            >
              <td className="px-6 py-4">
                {editingId === wallet.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="rounded border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      autoFocus
                    />
                  </div>
                ) : (
                  <span className="font-mono text-sm text-foreground">{wallet.name}</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-muted-foreground">
                    {shortenKey(wallet.publicKey)}
                  </code>
                  <button
                    onClick={() => handleCopyPublicKey(wallet.publicKey)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copy Public Key"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  {editingId === wallet.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(wallet.id)}
                        className="rounded p-1 text-foreground hover:bg-muted transition-colors"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onCopyPrivateKey(wallet.id)}
                        className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Copy Private Key"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(wallet)}
                        className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(wallet)}
                        className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
