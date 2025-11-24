'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';
import { useConnection } from '@/hooks/use-connection';
import { useTokenAuthorities } from '@/hooks/revoke-authority/use-token-authorities';
import { TokenAddressInput } from './token-address-input';
import { AuthorityStatusCard } from './authority-status-card';
import { RevokeMintTab } from './revoke-mint-tab';
import { RevokeFreezeTab } from './revoke-freeze-tab';
import { RevokeUpdateTab } from './revoke-update-tab';
import { useIsMobile } from '@/hooks/use-mobile';

export default function RevokeAuthorityForm() {
  const { publicKey, signTransaction } = useWallet();
  const connection = useConnection();
  const [tokenAddress, setTokenAddress] = useState('');
  const isMobile = useIsMobile();

  const { authorities, tokenInfo, isChecking, refetch } = useTokenAuthorities(
    tokenAddress,
    publicKey,
    connection,
  );

  const hasAnyAuthority =
    authorities?.hasMintAuthority ||
    authorities?.hasFreezeAuthority ||
    authorities?.hasUpdateAuthority;

  const getDefaultTab = () => {
    if (authorities?.canRevokeMint) return 'mint';
    if (authorities?.canRevokeFreeze) return 'freeze';
    if (authorities?.canRevokeUpdate) return 'update';
    return 'mint';
  };

  const enabledTabsCount =
    (authorities?.canRevokeMint ? 1 : 0) +
    (authorities?.canRevokeFreeze ? 1 : 0) +
    (authorities?.canRevokeUpdate ? 1 : 0);

  return (
    <div className={`max-h-[calc(100vh-100px)] overflow-y-auto ${isMobile ? 'py-2' : 'py-6'}`}>
      <div className={`max-w-2xl mx-auto p-2 bg-white space-y-6 ${!isMobile && 'border-gear'}`}>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Revoke Token Authorities
          </h2>
          <p className="text-sm text-muted-foreground">
            Permanently revoke mint, freeze, or update authorities for increased decentralization
          </p>
        </div>

        <div className="space-y-6">
          <TokenAddressInput
            value={tokenAddress}
            onChange={setTokenAddress}
            isChecking={isChecking}
            authorities={authorities}
          />

          {authorities && tokenInfo && (
            <AuthorityStatusCard authorities={authorities} tokenInfo={tokenInfo} />
          )}

          {authorities && hasAnyAuthority && tokenInfo && (
            <Tabs defaultValue={getDefaultTab()} className="w-full">
              <TabsList
                className={`grid w-full ${
                  enabledTabsCount === 3
                    ? 'grid-cols-3'
                    : enabledTabsCount === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-1'
                }`}
              >
                {authorities.canRevokeMint && (
                  <TabsTrigger value="mint">Mint Authority</TabsTrigger>
                )}
                {authorities.canRevokeFreeze && (
                  <TabsTrigger value="freeze">Freeze Authority</TabsTrigger>
                )}
                {authorities.canRevokeUpdate && (
                  <TabsTrigger value="update">Update Authority</TabsTrigger>
                )}
              </TabsList>

              {authorities.canRevokeMint && (
                <TabsContent value="mint">
                  <RevokeMintTab
                    tokenAddress={tokenAddress}
                    tokenInfo={tokenInfo}
                    publicKey={publicKey}
                    signTransaction={signTransaction}
                    connection={connection}
                    onSuccess={refetch}
                  />
                </TabsContent>
              )}

              {authorities.canRevokeFreeze && (
                <TabsContent value="freeze">
                  <RevokeFreezeTab
                    tokenAddress={tokenAddress}
                    tokenInfo={tokenInfo}
                    publicKey={publicKey}
                    signTransaction={signTransaction}
                    connection={connection}
                    onSuccess={refetch}
                  />
                </TabsContent>
              )}

              {authorities.canRevokeUpdate && (
                <TabsContent value="update">
                  <RevokeUpdateTab
                    tokenAddress={tokenAddress}
                    tokenInfo={tokenInfo}
                    publicKey={publicKey}
                    signTransaction={signTransaction}
                    connection={connection}
                    onSuccess={refetch}
                  />
                </TabsContent>
              )}
            </Tabs>
          )}

          {authorities && !hasAnyAuthority && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                You do not have any authority for this token. Only the authority owner can revoke
                authorities.
              </p>
            </div>
          )}

          {!publicKey && (
            <p className="text-sm text-center text-muted-foreground">
              Please connect your wallet to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
