'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface NetworkSwitchProps {
  isMainnet: boolean;
  onNetworkChange: (isMainnet: boolean) => void;
  disabled?: boolean;
}

export function NetworkSwitch({ isMainnet, onNetworkChange, disabled }: NetworkSwitchProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
      <div className="space-y-0.5">
        <Label htmlFor="network-switch" className="text-sm font-medium">
          Network
        </Label>
        <p className="text-xs text-muted-foreground">{isMainnet ? 'Mainnet Beta' : 'Devnet'}</p>
      </div>
      <Switch
        id="network-switch"
        checked={isMainnet}
        onCheckedChange={onNetworkChange}
        disabled={disabled}
      />
    </div>
  );
}
