import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { TokenAuthorities, TokenBasicInfo } from '@/hooks/revoke-authority/use-token-authorities';

interface AuthorityStatusCardProps {
  authorities: TokenAuthorities;
  tokenInfo: TokenBasicInfo | null;
}

export function AuthorityStatusCard({ authorities, tokenInfo }: AuthorityStatusCardProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-sm">Authority Status</h3>
          {tokenInfo && (
            <Badge variant="outline" className="ml-auto">
              {tokenInfo.isToken2022 ? 'Token-2022' : 'SPL Token'}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-background rounded-lg">
            <div className="flex items-center gap-3">
              {authorities.hasMintAuthority ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Mint Authority</p>
                {authorities.mintAuthority ? (
                  <p className="text-xs text-muted-foreground font-mono">
                    {authorities.mintAuthority.slice(0, 8)}...
                    {authorities.mintAuthority.slice(-8)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Not set (already revoked)</p>
                )}
              </div>
            </div>
            {authorities.hasMintAuthority ? (
              <Badge
                variant="default"
                className="bg-black text-white dark:bg-white dark:text-black"
              >
                You Own
              </Badge>
            ) : authorities.mintAuthority ? (
              <Badge variant="secondary">Other Wallet</Badge>
            ) : (
              <Badge variant="outline">Revoked</Badge>
            )}
          </div>

          {/* Freeze Authority */}
          <div className="flex items-center justify-between p-3 bg-background rounded-lg">
            <div className="flex items-center gap-3">
              {authorities.hasFreezeAuthority ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Freeze Authority</p>
                {authorities.freezeAuthority ? (
                  <p className="text-xs text-muted-foreground font-mono">
                    {authorities.freezeAuthority.slice(0, 8)}...
                    {authorities.freezeAuthority.slice(-8)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Not set (already revoked)</p>
                )}
              </div>
            </div>
            {authorities.hasFreezeAuthority ? (
              <Badge
                variant="default"
                className="bg-black text-white dark:bg-white dark:text-black"
              >
                You Own
              </Badge>
            ) : authorities.freezeAuthority ? (
              <Badge variant="secondary">Other Wallet</Badge>
            ) : (
              <Badge variant="outline">Revoked</Badge>
            )}
          </div>

          {tokenInfo?.isToken2022 && (
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-3">
                {authorities.hasUpdateAuthority ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Update Authority</p>
                  {authorities.updateAuthority ? (
                    <p className="text-xs text-muted-foreground font-mono">
                      {authorities.updateAuthority.slice(0, 8)}...
                      {authorities.updateAuthority.slice(-8)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not set (no metadata extension)</p>
                  )}
                </div>
              </div>
              {authorities.hasUpdateAuthority ? (
                <Badge
                  variant="default"
                  className="bg-black text-white dark:bg-white dark:text-black"
                >
                  You Own
                </Badge>
              ) : authorities.updateAuthority ? (
                <Badge variant="secondary">Other Wallet</Badge>
              ) : (
                <Badge variant="outline">Not Set</Badge>
              )}
            </div>
          )}
        </div>

        {tokenInfo && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Current Supply:</span>
              <span className="font-mono">{tokenInfo.supply}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
