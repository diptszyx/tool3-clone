// password-modal.tsx
'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, Lock, Shield } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  action: 'backup' | 'restore' | 'set' | 'verify' | null;
}

export default function PasswordModal({ isOpen, onClose, onSubmit, action }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const isSetPasswordMode = action === 'set';
  const isVerifyMode = action === 'verify';

  const handleSubmit = () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    if (isSetPasswordMode) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    onSubmit(password);
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const getTitle = () => {
    switch (action) {
      case 'set':
        return 'Set Master Password';
      case 'verify':
        return 'Verify Password';
      case 'backup':
        return 'Backup Wallets';
      case 'restore':
        return 'Restore Wallets';
      default:
        return 'Enter Password';
    }
  };

  const getDescription = () => {
    switch (action) {
      case 'set':
        return 'Create a master password to encrypt your wallet private keys';
      case 'verify':
        return 'Enter your master password to unlock and view your wallets';
      case 'backup':
        return 'Enter your password to create an encrypted backup';
      case 'restore':
        return 'Enter your password to restore wallets from backup';
      default:
        return 'Enter your password to continue';
    }
  };

  const getIcon = () => {
    if (isVerifyMode) return <Shield className="h-5 w-5 text-primary" />;
    if (isSetPasswordMode) return <Lock className="h-5 w-5 text-primary" />;
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h2 className="text-xl font-bold text-foreground">{getTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSetPasswordMode && (
          <div className="mb-4 rounded-lg bg-muted p-3">
            <p className="text-sm text-foreground">
              ⚠️ <strong>Important:</strong> This password will encrypt your private keys.
              <br />
              <strong>Write it down and keep it safe!</strong> You cannot recover it.
            </p>
          </div>
        )}

        <p className="mb-4 text-sm text-muted-foreground">{getDescription()}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {isSetPasswordMode ? 'Master Password' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSetPasswordMode) handleSubmit();
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={
                  isSetPasswordMode ? 'Enter master password (min 8 chars)' : 'Enter password'
                }
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isSetPasswordMode && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                  }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-foreground bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isSetPasswordMode ? 'Set Password' : isVerifyMode ? 'Unlock' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
