import { useState } from 'react';
import Image from 'next/image';
import { TokenMetadata } from '@/lib/clone-token/fetch-token-metadata';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon } from 'lucide-react';

interface OriginalTokenCardProps {
  tokenInfo: TokenMetadata;
}

export function OriginalTokenCard({ tokenInfo }: OriginalTokenCardProps) {
  const [isError, setIsError] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {tokenInfo.image && !isError ? (
              <Image
                src={tokenInfo.image}
                alt={tokenInfo.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
                onError={() => setIsError(true)}
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xl">{tokenInfo.name}</span>
            <Badge variant="secondary" className="w-fit">
              {tokenInfo.symbol}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>Original Token Information</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-sm">
          <div className="text-muted-foreground font-medium">Decimals:</div>
          <div className="font-mono font-semibold">{tokenInfo.decimals}</div>

          <div className="text-muted-foreground font-medium">Program:</div>
          <div className="font-mono text-xs break-all">{tokenInfo.programId.toBase58()}</div>

          {tokenInfo.uri && (
            <>
              <div className="text-muted-foreground font-medium">Metadata URI:</div>
              <a
                href={tokenInfo.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-blue-600 hover:underline break-all"
              >
                {tokenInfo.uri}
              </a>
            </>
          )}
        </div>

        {tokenInfo.description && (
          <div className="space-y-1 pt-2 border-t">
            <div className="text-sm font-medium text-muted-foreground">Description:</div>
            <p className="text-sm leading-relaxed">{tokenInfo.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
