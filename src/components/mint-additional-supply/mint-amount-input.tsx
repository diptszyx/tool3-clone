import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidAmount } from '@/hooks/use-mint-token';

interface MintAmountInputProps {
  value: string;
  onChange: (value: string) => void;
  tokenSymbol?: string;
}

export const MintAmountInput = ({ value, onChange, tokenSymbol }: MintAmountInputProps) => {
  const showError = value && !isValidAmount(value);

  return (
    <div className="space-y-2">
      <Label htmlFor="mint-amount">
        Mint Amount {tokenSymbol && <span className="text-muted-foreground">({tokenSymbol})</span>}
      </Label>
      <Input
        id="mint-amount"
        type="number"
        step="any"
        min="0"
        placeholder="Example: 1000"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={showError ? 'border-red-500' : ''}
      />
      {showError && <p className="text-xs text-red-500">Please enter a valid positive number</p>}
    </div>
  );
};
