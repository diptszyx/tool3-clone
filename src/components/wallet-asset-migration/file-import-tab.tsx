'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, Download, FileCheck } from 'lucide-react';

interface FileImportTabProps {
  onBack: () => void;
  onAddWallets: (wallets: string[]) => void;
}

export default function FileImportTab({ onBack, onAddWallets }: FileImportTabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [previewCount, setPreviewCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['.csv', '.txt', '.json', '.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(fileExtension)) {
      setError('Invalid file type. Please upload CSV, TXT, JSON, or Excel files.');
      setSelectedFile(null);
      setPreviewCount(0);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      setSelectedFile(null);
      setPreviewCount(0);
      return;
    }

    setError('');
    setSelectedFile(file);

    // Preview key count
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim().length > 0);
      setPreviewCount(lines.length);
    } catch {
      setPreviewCount(0);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      const text = await selectedFile.text();
      let keys: string[] = [];

      if (selectedFile.name.endsWith('.json')) {
        try {
          const json = JSON.parse(text);
          keys = Array.isArray(json)
            ? json
            : // eslint-disable-next-line @typescript-eslint/no-explicit-any
              json.wallets?.map((w: any) => w.privateKey || w.key) || [];
        } catch {
          setError('Invalid JSON format');
          return;
        }
      } else if (selectedFile.name.endsWith('.csv')) {
        keys = text
          .split('\n')
          .slice(1)
          .map((line) => line.split(',')[0]?.trim())
          .filter((key) => key && key.length > 0);
      } else {
        keys = text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
      }

      if (keys.length === 0) {
        setError('No valid keys found in file');
        return;
      }

      const invalidKeys = keys.filter((key) => key.length < 32);
      if (invalidKeys.length > 0) {
        setError(`Found ${invalidKeys.length} invalid key(s) in file`);
        return;
      }

      onAddWallets(keys);
    } catch {
      setError('Failed to read file. Please check the format.');
    }
  };

  const downloadTemplate = (format: 'csv' | 'txt' | 'json') => {
    const templates = {
      csv: 'private_key\n5J1example1...\n5J2example2...\n5J3example3...',
      txt: '5J1example1...\n5J2example2...\n5J3example3...',
      json: JSON.stringify(
        {
          wallets: [
            { privateKey: '5J1example1...' },
            { privateKey: '5J2example2...' },
            { privateKey: '5J3example3...' },
          ],
        },
        null,
        2,
      ),
    };

    const blob = new Blob([templates[format]], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-import-template.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 py-2">
      <div>
        <Label>Upload File</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Supported: CSV, TXT, JSON, Excel (max 5MB)
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => downloadTemplate('csv')}
            >
              <Download className="h-3 w-3" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => downloadTemplate('txt')}
            >
              <Download className="h-3 w-3" />
              TXT
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => downloadTemplate('json')}
            >
              <Download className="h-3 w-3" />
              JSON
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleImport} disabled={!selectedFile}>
          Import {previewCount > 0 && `(${previewCount})`}
        </Button>
      </div>
    </div>
  );
}
