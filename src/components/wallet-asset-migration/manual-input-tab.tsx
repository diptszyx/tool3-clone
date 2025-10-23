'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Key } from 'lucide-react';

interface ManualInputTabProps {
  onBack: () => void;
  onAddWallets: (wallets: string[]) => void;
}

export default function ManualInputTab({ onBack, onAddWallets }: ManualInputTabProps) {
  const [privateKeys, setPrivateKeys] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    setError('');
    const keys = privateKeys
      .split('\n')
      .map((key) => key.trim())
      .filter((key) => key.length > 0);

    if (keys.length === 0) {
      setError('Please enter at least one private key');
      return;
    }

    const invalidKeys = keys.filter((key) => key.length < 32);
    if (invalidKeys.length > 0) {
      setError(`Found ${invalidKeys.length} invalid key(s). Keys must be at least 32 characters.`);
      return;
    }

    onAddWallets(keys);
  };

  return (
    <div className="space-y-4 py-2">
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 flex items-start gap-2">
        <Key className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-900 dark:text-blue-100">
          Enter one private key per line. Keys will be validated and converted to public addresses.
        </p>
      </div>

      <div>
        <Label htmlFor="privateKeys">Private Keys</Label>
        <Textarea
          id="privateKeys"
          placeholder="5J... (Base58 private key)&#10;Enter one key per line"
          value={privateKeys}
          onChange={(e) => {
            setPrivateKeys(e.target.value);
            setError('');
          }}
          className="font-mono text-sm min-h-[200px] mt-2"
        />
        {privateKeys && (
          <p className="text-xs text-muted-foreground mt-1">
            {privateKeys.split('\n').filter((k) => k.trim()).length} key(s) entered
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleImport} disabled={!privateKeys.trim()}>
          Import Wallets
        </Button>
      </div>
    </div>
  );
}
