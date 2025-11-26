import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface TokenAddressInputProps {
  onAddressChange: (address: string) => void;
  isLoading?: boolean;
}

export function TokenAddressInput({ onAddressChange, isLoading }: TokenAddressInputProps) {
  const [address, setAddress] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (address.trim().length > 32) {
        onAddressChange(address.trim());
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [address, onAddressChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="token-address">Token Address</Label>
      <div className="relative">
        <Input
          id="token-address"
          type="text"
          placeholder="Enter Solana token address... "
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isLoading}
          className="font-mono text-sm pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      {address.trim().length > 0 && address.trim().length < 32 && (
        <p className="text-xs text-muted-foreground">
          Enter a valid Solana address (min 32 characters)
        </p>
      )}
    </div>
  );
}
