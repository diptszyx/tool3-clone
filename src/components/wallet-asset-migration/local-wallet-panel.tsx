'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, AlertCircle, Wallet, CheckCircle2 } from 'lucide-react';
import { dbService } from '@/lib/indexeddb-service';
import { decryptPrivateKey } from '@/lib/wallet-service';
import { toast } from 'sonner';

interface LocalWalletPanelProps {
  onBack: () => void;
  onAddWallets: (publicKeys: string[], password: string) => void;
}

export default function LocalWalletPanel({ onBack, onAddWallets }: LocalWalletPanelProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [walletCount, setWalletCount] = useState<number>(0);
  const [hasWallets, setHasWallets] = useState<boolean | null>(null);

  useEffect(() => {
    checkLocalWallets();
  }, []);

  const checkLocalWallets = async () => {
    try {
      await dbService.init();
      const walletsData = await dbService.getAllWallets();

      setWalletCount(walletsData.length);

      if (walletsData.length === 0) {
        setHasWallets(false);
        setError('No local wallets found. Please create wallets in Wallet Manager first.');
      } else {
        setHasWallets(true);
      }
    } catch (error) {
      console.error('Error checking wallets:', error);
      setError('Failed to access local wallet storage');
      setHasWallets(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await dbService.init();
      const walletsData = await dbService.getAllWallets();

      if (walletsData.length === 0) {
        setError('No wallets found');
        return;
      }

      try {
        decryptPrivateKey(walletsData[0].encryptedPrivateKey, password);
      } catch {
        setError('Invalid password. Please try again.');
        return;
      }

      const publicKeys = walletsData.map((w) => w.publicKey);

      toast.success(`Successfully imported ${publicKeys.length} wallet(s)`);
      onAddWallets(publicKeys, password);
    } catch (error) {
      console.error('Error loading wallets:', error);
      setError('Failed to load wallets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Unlock Local Wallet Manager</p>
            <p className="text-xs text-muted-foreground">
              Enter your master password to securely import wallets
            </p>
            {hasWallets && walletCount > 0 && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-primary/20">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">
                  {walletCount} wallet{walletCount !== 1 ? 's' : ''} found
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasWallets === false && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No wallets found. Please create wallets in the Wallet Manager first, then return here to
            import them.
          </AlertDescription>
        </Alert>
      )}

      {hasWallets && (
        <>
          <div>
            <Label htmlFor="password">Master Password</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) handlePasswordSubmit();
                }}
                placeholder="Enter your master password"
                className="pr-10"
                autoFocus
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Password entered
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button
          onClick={handlePasswordSubmit}
          disabled={isLoading || !password || hasWallets === false}
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Importing...
            </>
          ) : (
            `Import ${walletCount > 0 ? walletCount : ''} Wallet${walletCount !== 1 ? 's' : ''}`
          )}
        </Button>
      </div>
    </div>
  );
}
