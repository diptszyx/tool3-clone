'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileCheck, Download, AlertCircle } from 'lucide-react';
import type { Wallet } from '@/components/local-wallet-manager/wallet-manager';
import {
  validateFile,
  parseWalletFile,
  isValidSolanaPrivateKey,
  downloadTemplate,
} from '@/lib/wallet-file-parser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (wallets: Wallet[], mode: 'append' | 'overwrite') => void;
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [importMode, setImportMode] = useState<'append' | 'overwrite'>('append');
  const [suffix, setSuffix] = useState<'last4' | 'sequence'>('last4');
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewCount, setPreviewCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setSelectedFile(null);
      setPreviewCount(0);
      return;
    }

    setError('');
    setSelectedFile(file);

    try {
      const keys = await parseWalletFile(file);
      setPreviewCount(keys.length);
    } catch {
      setError('Failed to preview file');
      setPreviewCount(0);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      const keys = await parseWalletFile(selectedFile);

      if (keys.length === 0) {
        setError('No private keys detected');
        return;
      }

      const invalidKeys = keys.filter((k) => !isValidSolanaPrivateKey(k));
      if (invalidKeys.length > 0) {
        setError(`Found ${invalidKeys.length} invalid key(s)`);
        return;
      }

      const wallets: Wallet[] = keys.map((k, idx) => ({
        id: `imported-${Date.now()}-${idx + 1}`,
        name:
          suffix === 'sequence'
            ? `Imported_${String(idx + 1).padStart(4, '0')}`
            : `Wallet_${k.slice(-4)}`,
        publicKey: '',
        privateKey: k,
        createdAt: new Date(),
      }));

      onImport(wallets, importMode);
      onClose();
    } catch (err) {
      setError('Failed to parse file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Import Wallets</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Upload File</label>
            <div
              className="mt-2 rounded-lg border-2 border-dashed border-border bg-muted p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.json,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <FileCheck className="h-6 w-6 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  {previewCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Found {previewCount} private key(s)
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm">Click to upload or drag file</p>
                  <p className="text-xs text-muted-foreground">CSV, TXT, JSON, Excel (max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-100 rounded-md p-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">Download Templates</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {['csv', 'txt', 'json', 'xlsx'].map((f) => (
                <button
                  key={f}
                  onClick={() => downloadTemplate(f as 'csv' | 'txt' | 'json' | 'xlsx')}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-1 text-sm hover:bg-muted"
                >
                  <Download className="h-4 w-4" /> {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Suffix Type</label>
            <div className="mt-2 space-y-1">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="suffix"
                  value="last4"
                  checked={suffix === 'last4'}
                  onChange={() => setSuffix('last4')}
                />
                <span className="text-sm">Last 4 chars</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="suffix"
                  value="sequence"
                  checked={suffix === 'sequence'}
                  onChange={() => setSuffix('sequence')}
                />
                <span className="text-sm">Sequence number</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Import Mode</label>
            <div className="mt-2 space-y-1">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                />
                <span className="text-sm">Append</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="overwrite"
                  checked={importMode === 'overwrite'}
                  onChange={() => setImportMode('overwrite')}
                />
                <span className="text-sm">Overwrite</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-foreground bg-background px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import {previewCount > 0 && `(${previewCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
