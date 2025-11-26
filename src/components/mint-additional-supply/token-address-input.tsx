import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { TokenInfo } from '@/hooks/use-token-info';

interface TokenAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  isChecking: boolean;
  tokenInfo: TokenInfo | null;
}

const isValidAddressFormat = (address: string): boolean => {
  if (!address) return true;
  return address.length >= 32 && address.length <= 44;
};

export const TokenAddressInput = ({
  value,
  onChange,
  isChecking,
  tokenInfo,
}: TokenAddressInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="token-address">Token Address</Label>
      <Input
        id="token-address"
        placeholder="Enter token address..."
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
      />

      <div className="min-h-[20px]">
        {isChecking && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Checking token...</span>
          </div>
        )}

        {!isChecking && value && !tokenInfo && !isValidAddressFormat(value) && (
          <p className="text-sm text-red-500">Invalid address format (must be 32-44 characters)</p>
        )}

        {!isChecking && tokenInfo && (
          <div className="space-y-1">
            {tokenInfo.canMint ? (
              <p className="text-sm text-green-600 font-medium"> You have mint authority</p>
            ) : (
              <p className="text-sm text-red-500 font-medium"> You do not have mint authority</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
