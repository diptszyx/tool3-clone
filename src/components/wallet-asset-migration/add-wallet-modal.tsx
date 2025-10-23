'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, FileUp } from 'lucide-react';
import LocalWalletPanel from '@/components/wallet-asset-migration/local-wallet-panel';
import ManualImportPanel from '@/components/wallet-asset-migration/manual-import-panel';

interface AddWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWallets: (wallets: string[], password?: string) => void;
}

export default function AddWalletModal({ open, onOpenChange, onAddWallets }: AddWalletModalProps) {
  const [selectedOption, setSelectedOption] = useState<'local' | 'manual' | null>(null);

  const handleOptionSelect = (option: 'local' | 'manual') => {
    setSelectedOption(option);
  };

  const handleBack = () => {
    setSelectedOption(null);
  };

  const handleClose = () => {
    setSelectedOption(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Wallets</DialogTitle>
          <DialogDescription>
            {!selectedOption
              ? 'Choose how you want to add wallets'
              : selectedOption === 'local'
                ? 'Select wallets from your local wallet manager'
                : 'Import wallets manually'}
          </DialogDescription>
        </DialogHeader>

        {!selectedOption ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-3"
              onClick={() => handleOptionSelect('local')}
            >
              <Wallet className="h-8 w-8" />
              <div className="text-center">
                <p className="font-semibold">Local Wallet Helper</p>
                <p className="text-xs text-muted-foreground mt-1">Use wallets from your manager</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-32 flex flex-col gap-3"
              onClick={() => handleOptionSelect('manual')}
            >
              <FileUp className="h-8 w-8" />
              <div className="text-center">
                <p className="font-semibold">Manual Import</p>
                <p className="text-xs text-muted-foreground mt-1">Import from file or paste keys</p>
              </div>
            </Button>
          </div>
        ) : selectedOption === 'local' ? (
          <LocalWalletPanel
            onBack={handleBack}
            onAddWallets={(publicKeys, password) => onAddWallets(publicKeys, password)}
          />
        ) : (
          <ManualImportPanel
            onBack={handleBack}
            onAddWallets={(publicKeys) => onAddWallets(publicKeys)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
