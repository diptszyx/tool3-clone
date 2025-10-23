'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import type { Wallet } from '@/components/local-wallet-manager/wallet-manager';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (wallets: Wallet[], mode: 'append' | 'overwrite') => void;
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [importMode, setImportMode] = useState<'append' | 'overwrite'>('append');
  const [suffix, setSuffix] = useState<'last4' | 'sequence'>('last4');
  const [pasteContent, setPasteContent] = useState('');
  const [fieldMapping, setFieldMapping] = useState('privateKey');

  const handleImport = () => {
    // Demo: create sample wallets
    const newWallets: Wallet[] = [
      {
        id: `imported-${Date.now()}-1`,
        name: `Imported_0001`,
        publicKey: 'ImportedPublicKey1234567890abcdefghijklmnop',
        privateKey: 'ImportedPrivateKey1234567890abcdefghijklmnop',
        createdAt: new Date(),
      },
      {
        id: `imported-${Date.now()}-2`,
        name: `Imported_0002`,
        publicKey: 'ImportedPublicKey9876543210zyxwvutsrqponmlkjih',
        privateKey: 'ImportedPrivateKey9876543210zyxwvutsrqponmlkjih',
        createdAt: new Date(),
      },
    ];
    onImport(newWallets, importMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Import Wallets</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Upload File</label>
            <div className="mt-2 rounded-lg border-2 border-dashed border-border bg-muted p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Drag and drop or click to upload</p>
              <p className="text-xs text-muted-foreground">CSV, JSON, or XLSX</p>
              <input type="file" accept=".csv,.json,.xlsx" className="mt-2 w-full cursor-pointer" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Or Paste Content</label>
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste JSON or CSV content here..."
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Private Key Field</label>
            <select
              value={fieldMapping}
              onChange={(e) => setFieldMapping(e.target.value)}
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="privateKey">privateKey</option>
              <option value="secret">secret</option>
              <option value="key">key</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Select the field containing private keys
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Suffix Type</label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="suffix"
                  value="last4"
                  checked={suffix === 'last4'}
                  onChange={(e) => setSuffix(e.target.value as 'last4' | 'sequence')}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-sm text-foreground">SOL address last 4 digits</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="suffix"
                  value="sequence"
                  checked={suffix === 'sequence'}
                  onChange={(e) => setSuffix(e.target.value as 'last4' | 'sequence')}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-sm text-foreground">Sequence Number</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Import Mode</label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={(e) => setImportMode(e.target.value as 'append' | 'overwrite')}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-sm text-foreground">Append to existing</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="overwrite"
                  checked={importMode === 'overwrite'}
                  onChange={(e) => setImportMode(e.target.value as 'append' | 'overwrite')}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-sm text-foreground">Overwrite existing</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-foreground bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
