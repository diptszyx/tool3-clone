import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { TokenAuthorities } from '@/hooks/revoke-authority/use-token-authorities';

interface TokenAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  isChecking: boolean;
  authorities: TokenAuthorities | null;
  error: string | null;
}

export function TokenAddressInput({
  value,
  onChange,
  isChecking,
  authorities,
  error,
}: TokenAddressInputProps) {
  const hasAnyAuthority =
    authorities?.hasMintAuthority ||
    authorities?.hasFreezeAuthority ||
    authorities?.hasUpdateAuthority;

  return (
    <div className="space-y-2">
      <Label htmlFor="token-address">Token Address</Label>
      <Input
        id="token-address"
        placeholder="Enter token mint address..."
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
      />

      <div className="min-h-[20px]">
        {isChecking && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Checking authorities...</span>
          </div>
        )}

        {!isChecking && error && error !== 'no_authority' && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}

        {!isChecking && error === 'no_authority' && (
          <p className="text-sm text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            You do not own any authority for this token
          </p>
        )}

        {!isChecking && authorities && hasAnyAuthority && (
          <p className="text-sm text-green-600 font-medium">
            Authority found - select tab below to revoke
          </p>
        )}
      </div>
    </div>
  );
}
