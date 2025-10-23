'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, Download, FileCheck } from 'lucide-react';
import {
  validateFile,
  parseWalletFile,
  isValidSolanaPrivateKey,
  convertPrivateKeyToAddress,
  downloadTemplate,
} from '@/lib/wallet-file-parser';

interface FileImportTabProps {
  onBack: () => void;
  onAddWallets: (wallets: Array<{ address: string; privateKey: string }>) => void;
}

export default function FileImportTab({ onBack, onAddWallets }: FileImportTabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
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
      setError('Please select a file first');
      return;
    }

    try {
      const keys = await parseWalletFile(selectedFile);

      if (keys.length === 0) {
        setError('No valid keys found in file');
        return;
      }

      const invalidKeys = keys.filter((key) => !isValidSolanaPrivateKey(key));
      if (invalidKeys.length > 0) {
        setError(`Found ${invalidKeys.length} invalid Solana private key(s)`);
        return;
      }

      const walletData = keys
        .map(convertPrivateKeyToAddress)
        .filter((data): data is { address: string; privateKey: string } => data !== null);

      if (walletData.length !== keys.length) {
        setError('Failed to convert some private keys');
        return;
      }

      onAddWallets(walletData);
    } catch (err) {
      setError('Failed to read file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div>
        <Label>Upload File</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Supported: CSV, TXT, JSON, Excel (max 5MB) - Solana private keys only
        </p>

        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
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
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <FileCheck className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              {previewCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Found {previewCount} potential key(s)
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">or drag and drop</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-4 bg-muted/50">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <p className="text-sm font-semibold">Download Templates</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['csv', 'txt', 'json', 'xlsx'].map((format) => (
              <Button
                key={format}
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => downloadTemplate(format as 'csv' | 'txt' | 'json' | 'xlsx')}
              >
                <Download className="h-3 w-3" />
                {format.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleImport} disabled={!selectedFile}>
          Import & Fetch {previewCount > 0 && `(${previewCount})`}
        </Button>
      </div>
    </div>
  );
}
