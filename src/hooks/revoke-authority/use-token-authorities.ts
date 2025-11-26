import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMetadataPointerState,
} from '@solana/spl-token';
import { toast } from 'sonner';

export interface TokenAuthorities {
  mintAuthority: string | null;
  freezeAuthority: string | null;
  updateAuthority: string | null;

  hasMintAuthority: boolean;
  hasFreezeAuthority: boolean;
  hasUpdateAuthority: boolean;

  canRevokeMint: boolean;
  canRevokeFreeze: boolean;
  canRevokeUpdate: boolean;
}

export interface TokenBasicInfo {
  isToken2022: boolean;
  decimals: number;
  supply: string;
  programId: PublicKey;
}

const isValidAddress = (address: string): boolean => {
  if (!address || address.length < 32 || address.length > 44) return false;
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export function useTokenAuthorities(
  tokenAddress: string,
  walletPublicKey: PublicKey | null,
  connection: Connection,
) {
  const [authorities, setAuthorities] = useState<TokenAuthorities | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenBasicInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkAuthorities = useCallback(async () => {
    if (!tokenAddress || !walletPublicKey) {
      setAuthorities(null);
      setTokenInfo(null);
      return;
    }

    if (!isValidAddress(tokenAddress)) {
      setAuthorities(null);
      setTokenInfo(null);
      toast.error('Invalid token address format');
      return;
    }

    setIsChecking(true);
    setAuthorities(null);
    setTokenInfo(null);

    try {
      const mintPubkey = new PublicKey(tokenAddress);
      let mintInfo;
      let programId = TOKEN_PROGRAM_ID;
      let isToken2022 = false;

      try {
        mintInfo = await getMint(connection, mintPubkey, 'confirmed', TOKEN_PROGRAM_ID);
      } catch {
        try {
          mintInfo = await getMint(connection, mintPubkey, 'confirmed', TOKEN_2022_PROGRAM_ID);
          programId = TOKEN_2022_PROGRAM_ID;
          isToken2022 = true;
        } catch {
          throw new Error('Token does not exist or invalid address. Please verify and try again.');
        }
      }

      const hasMintAuthority =
        mintInfo.mintAuthority !== null && mintInfo.mintAuthority.equals(walletPublicKey);
      const canRevokeMint = hasMintAuthority;

      const hasFreezeAuthority =
        mintInfo.freezeAuthority !== null && mintInfo.freezeAuthority.equals(walletPublicKey);
      const canRevokeFreeze = hasFreezeAuthority;

      let updateAuthority: string | null = null;
      let hasUpdateAuthority = false;
      let canRevokeUpdate = false;

      if (isToken2022) {
        try {
          const metadataPointer = getMetadataPointerState(mintInfo);
          if (metadataPointer?.authority) {
            updateAuthority = metadataPointer.authority.toBase58();
            hasUpdateAuthority = metadataPointer.authority.equals(walletPublicKey);
            canRevokeUpdate = hasUpdateAuthority;
          }
        } catch {}
      }

      setAuthorities({
        mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
        freezeAuthority: mintInfo.freezeAuthority?.toBase58() || null,
        updateAuthority,
        hasMintAuthority,
        hasFreezeAuthority,
        hasUpdateAuthority,
        canRevokeMint,
        canRevokeFreeze,
        canRevokeUpdate,
      });

      setTokenInfo({
        isToken2022,
        decimals: mintInfo.decimals,
        supply: (Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toLocaleString(),
        programId,
      });

      const hasAnyAuthority = hasMintAuthority || hasFreezeAuthority || hasUpdateAuthority;
      if (!hasAnyAuthority) {
        toast.warning('You do not have any authority for this token');
      }
    } catch (error) {
      setAuthorities(null);
      setTokenInfo(null);
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        toast.error('Failed to check token. Please verify the address.');
      }
    } finally {
      setIsChecking(false);
    }
  }, [tokenAddress, walletPublicKey, connection]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    const timer = setTimeout(() => {
      if (tokenAddress && walletPublicKey) {
        checkAuthorities();
      } else {
        setAuthorities(null);
        setTokenInfo(null);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [tokenAddress, walletPublicKey, checkAuthorities]);

  return {
    authorities,
    tokenInfo,
    isChecking,
    refetch: checkAuthorities,
  };
}
