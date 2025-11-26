import { useState, useEffect, useCallback, useRef } from 'react';
import { PublicKey, Connection } from '@solana/web3.js';
import {
  getMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMetadataPointerState,
  getTokenMetadata,
} from '@solana/spl-token';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { toast } from 'sonner';

export interface TokenMetadata {
  name?: string;
  symbol?: string;
  uri?: string;
}

export interface TokenInfo {
  canMint: boolean;
  decimals: number;
  supply: string;
  mintAuthority: string | null;
  programId: string;
  isToken2022: boolean;
  metadata: TokenMetadata | null;
}

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

const isValidAddress = (address: string): boolean => {
  if (!address || address.length < 32 || address.length > 44) return false;
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

const getMetaplexMetadata = async (
  connection: Connection,
  mintPubkey: PublicKey,
): Promise<TokenMetadata | null> => {
  try {
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
      METADATA_PROGRAM_ID,
    );

    const accountInfo = await connection.getAccountInfo(metadataPDA);
    if (!accountInfo) return null;

    const [metadata] = Metadata.fromAccountInfo(accountInfo);

    return {
      name: metadata.data.name.replace(/\0/g, '').trim(),
      symbol: metadata.data.symbol.replace(/\0/g, '').trim(),
      uri: metadata.data.uri.replace(/\0/g, '').trim(),
    };
  } catch {
    return null;
  }
};

export const useTokenInfo = (
  tokenAddress: string,
  publicKey: PublicKey | null,
  connection: Connection,
) => {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkMintAuthority = useCallback(async () => {
    if (!tokenAddress || !publicKey) {
      setTokenInfo(null);
      return;
    }

    if (!isValidAddress(tokenAddress)) {
      setTokenInfo(null);
      toast.error('Invalid token address format');
      return;
    }

    setIsChecking(true);
    setTokenInfo(null);

    try {
      const mintPubkey = new PublicKey(tokenAddress);
      let mintInfo = null;
      let programId = TOKEN_PROGRAM_ID;
      let isToken2022 = false;
      let metadata: TokenMetadata | null = null;

      try {
        mintInfo = await getMint(connection, mintPubkey, 'confirmed', TOKEN_PROGRAM_ID);
        metadata = await getMetaplexMetadata(connection, mintPubkey);
      } catch {
        try {
          mintInfo = await getMint(connection, mintPubkey, 'confirmed', TOKEN_2022_PROGRAM_ID);
          programId = TOKEN_2022_PROGRAM_ID;
          isToken2022 = true;

          const metadataPointer = getMetadataPointerState(mintInfo);

          if (metadataPointer?.metadataAddress) {
            try {
              const tokenMetadata = await getTokenMetadata(
                connection,
                mintPubkey,
                'confirmed',
                TOKEN_2022_PROGRAM_ID,
              );

              if (tokenMetadata) {
                metadata = {
                  name: tokenMetadata.name,
                  symbol: tokenMetadata.symbol,
                  uri: tokenMetadata.uri,
                };
              }
            } catch {
              metadata = await getMetaplexMetadata(connection, mintPubkey);
            }
          } else {
            metadata = await getMetaplexMetadata(connection, mintPubkey);
          }
        } catch {
          throw new Error(
            'Token does not exist or invalid token address. Please verify and try again.',
          );
        }
      }

      if (!mintInfo) {
        throw new Error('Failed to fetch mint information');
      }

      const canMint = mintInfo.mintAuthority !== null && mintInfo.mintAuthority.equals(publicKey);

      const info: TokenInfo = {
        canMint,
        decimals: mintInfo.decimals,
        supply: (Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toLocaleString(),
        mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
        programId: programId.toBase58(),
        isToken2022,
        metadata,
      };

      setTokenInfo(info);

      if (!canMint) {
        toast.warning('You do not have mint authority for this token');
      }
    } catch (error) {
      setTokenInfo(null);
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        toast.error('Failed to check token. Please verify the address.');
      }
    } finally {
      setIsChecking(false);
    }
  }, [tokenAddress, publicKey, connection]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    const timer = setTimeout(() => {
      if (tokenAddress && publicKey) {
        checkMintAuthority();
      } else {
        setTokenInfo(null);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [tokenAddress, publicKey, checkMintAuthority]);

  const updateSupplyOptimistically = useCallback((additionalAmount: number) => {
    setTokenInfo((prev) => {
      if (!prev) return prev;
      const currentSupplyNumber = parseFloat(prev.supply.replace(/,/g, ''));
      const newSupply = currentSupplyNumber + additionalAmount;
      return {
        ...prev,
        supply: newSupply.toLocaleString(),
      };
    });
  }, []);

  return {
    tokenInfo,
    isChecking,
    refetch: checkMintAuthority,
    updateSupplyOptimistically,
  };
};
