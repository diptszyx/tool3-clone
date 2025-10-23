'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Key } from 'lucide-react';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

interface ManualInputTabProps {
  onBack: () => void;
  onAddWallets: (wallets: Array<{ address: string; privateKey: string }>) => void;
}

export default function ManualInputTab({ onBack, onAddWallets }: ManualInputTabProps) {
  const [privateKeys, setPrivateKeys] = useState('');
  const [error, setError] = useState('');

  const isValidPrivateKey = (key: string): boolean => {
    const trimmed = key.trim();

    try {
      if (trimmed.length < 80 || trimmed.length > 90) return false;

      const decoded = bs58.decode(trimmed);

      if (decoded.length !== 64) return false;

      Keypair.fromSecretKey(decoded);

      return true;
    } catch {
      return false;
    }
  };

  const convertPrivateKey = (
    privateKey: string,
  ): { address: string; privateKey: string } | null => {
    try {
      const decoded = bs58.decode(privateKey.trim());
      const keypair = Keypair.fromSecretKey(decoded);
      return {
        address: keypair.publicKey.toBase58(),
        privateKey: privateKey.trim(),
      };
    } catch {
      return null;
    }
  };

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

    const invalidKeys = keys.filter((key) => !isValidPrivateKey(key));
    if (invalidKeys.length > 0) {
      setError(
        `Found ${invalidKeys.length} invalid Solana private key(s). Keys must be valid Base58 format (80-90 chars).`,
      );
      return;
    }

    const walletData = keys
      .map(convertPrivateKey)
      .filter((data): data is { address: string; privateKey: string } => data !== null);

    if (walletData.length !== keys.length) {
      setError('Failed to convert some private keys to addresses');
      return;
    }

    onAddWallets(walletData);
  };

  return (
    <div className="space-y-4 py-2">
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 flex items-start gap-2">
        <Key className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-900 dark:text-blue-100">
          Enter one Solana private key per line (Base58 format, 80-90 characters). Private keys will
          be securely stored in memory for transaction signing.
        </p>
      </div>

      <div>
        <Label htmlFor="privateKeys">Solana Private Keys</Label>
        <Textarea
          id="privateKeys"
          placeholder="3hz1gCrtibL2ppspeLcqcXtvfupF4guKJ153eXkodyR2FdrdjEP...&#10;Enter one key per line"
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
          Import & Fetch Wallets
        </Button>
      </div>
    </div>
  );
}
