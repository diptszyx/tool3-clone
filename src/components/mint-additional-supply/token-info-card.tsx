import { Card, CardContent } from '@/components/ui/card';
import { TokenInfo } from '@/hooks/use-token-info';

interface TokenInfoCardProps {
  tokenInfo: TokenInfo;
}

export const TokenInfoCard = ({ tokenInfo }: TokenInfoCardProps) => {
  return (
    <Card className="p-3 bg-muted rounded-lg">
      <CardContent className="space-y-2 text-xs p-0">
        {tokenInfo.metadata && (
          <>
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>
              <span className="text-right">{tokenInfo.metadata.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Symbol:</span>
              <span className="text-right">{tokenInfo.metadata.symbol}</span>
            </div>
          </>
        )}

        <div className="flex justify-between">
          <span className="font-medium">Type:</span>
          <span className="font-mono text-right">
            {tokenInfo.isToken2022 ? 'Token-2022' : 'SPL Token'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Current Supply:</span>
          <span className="text-right font-semibold">{tokenInfo.supply}</span>
        </div>

        {tokenInfo.mintAuthority && (
          <div className="flex flex-col gap-1 pt-1 border-t">
            <span className="font-medium">Mint Authority:</span>
            <span className="font-mono break-all text-[10px] text-muted-foreground">
              {tokenInfo.mintAuthority}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
