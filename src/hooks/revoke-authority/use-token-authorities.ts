import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMetadataPointerState,
  getTokenMetadata,
} from '@solana/spl-token';

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

async function getToken2022UpdateAuthority(
  connection: Connection,
  metadataAddress: PublicKey,
  mintAddress: PublicKey,
  walletPublicKey: PublicKey,
): Promise<{ authority: string | null; hasAuthority: boolean }> {
  try {
    const accountInfo = await connection.getAccountInfo(metadataAddress);
    if (!accountInfo) return { authority: null, hasAuthority: false };

    const isSameMint = metadataAddress.equals(mintAddress);

    if (isSameMint) {
      try {
        const metadata = await getTokenMetadata(
          connection,
          mintAddress,
          'confirmed',
          TOKEN_2022_PROGRAM_ID,
        );
        if (metadata && metadata.updateAuthority) {
          const updateAuthority = new PublicKey(metadata.updateAuthority);
          return {
            authority: updateAuthority.toBase58(),
            hasAuthority: updateAuthority.equals(walletPublicKey),
          };
        } else {
          return { authority: null, hasAuthority: false };
        }
      } catch {
        return await readMetadataManually(accountInfo.data, walletPublicKey, true);
      }
    } else {
      return await readMetadataManually(accountInfo.data, walletPublicKey, false);
    }
  } catch {
    return { authority: null, hasAuthority: false };
  }
}

async function readMetadataManually(
  data: Buffer,
  walletPublicKey: PublicKey,
  isInMintAccount: boolean,
): Promise<{ authority: string | null; hasAuthority: boolean }> {
  try {
    if (isInMintAccount) {
      let offset = data.length;
      while (offset > 86) {
        const extensionLength = data.readUInt16LE(offset - 2);
        const extensionType = data.readUInt16LE(offset - 4);
        if (extensionType === 3) {
          const extensionStart = offset - 4 - extensionLength;
          const updateAuthorityOption = data[extensionStart];
          if (updateAuthorityOption === 0) return { authority: null, hasAuthority: false };

          const updateAuthorityBytes = data.slice(extensionStart + 1, extensionStart + 33);
          if (updateAuthorityBytes.every((b) => b === 0))
            return { authority: null, hasAuthority: false };

          const updateAuthority = new PublicKey(updateAuthorityBytes);
          return {
            authority: updateAuthority.toBase58(),
            hasAuthority: updateAuthority.equals(walletPublicKey),
          };
        }
        offset = offset - 4 - extensionLength;
      }
      return { authority: null, hasAuthority: false };
    } else {
      if (data.length < 65) return { authority: null, hasAuthority: false };

      const updateAuthorityOption = data[0];
      if (updateAuthorityOption === 0) return { authority: null, hasAuthority: false };

      const updateAuthorityBytes = data.slice(1, 33);
      if (updateAuthorityBytes.every((b) => b === 0))
        return { authority: null, hasAuthority: false };

      const updateAuthority = new PublicKey(updateAuthorityBytes);
      return {
        authority: updateAuthority.toBase58(),
        hasAuthority: updateAuthority.equals(walletPublicKey),
      };
    }
  } catch {
    return { authority: null, hasAuthority: false };
  }
}

export function useTokenAuthorities(
  tokenAddress: string,
  walletPublicKey: PublicKey | null,
  connection: Connection,
) {
  const [authorities, setAuthorities] = useState<TokenAuthorities | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenBasicInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkAuthorities = useCallback(async () => {
    if (!tokenAddress || !walletPublicKey) {
      setAuthorities(null);
      setTokenInfo(null);
      setError(null);
      return;
    }
    if (!isValidAddress(tokenAddress)) {
      setAuthorities(null);
      setTokenInfo(null);
      setError('Invalid token address format');
      return;
    }

    setIsChecking(true);
    setAuthorities(null);
    setTokenInfo(null);
    setError(null);

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
          throw new Error('Token does not exist or invalid address');
        }
      }

      const hasMintAuthority =
        mintInfo.mintAuthority !== null && mintInfo.mintAuthority.equals(walletPublicKey);
      const hasFreezeAuthority =
        mintInfo.freezeAuthority !== null && mintInfo.freezeAuthority.equals(walletPublicKey);

      let updateAuthority: string | null = null;
      let hasUpdateAuthority = false;

      if (isToken2022) {
        try {
          const metadataPointer = getMetadataPointerState(mintInfo);
          if (metadataPointer?.metadataAddress) {
            const result = await getToken2022UpdateAuthority(
              connection,
              metadataPointer.metadataAddress,
              mintPubkey,
              walletPublicKey,
            );
            updateAuthority = result.authority;
            hasUpdateAuthority = result.hasAuthority;
          }
        } catch {}
      }

      const authResult: TokenAuthorities = {
        mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
        freezeAuthority: mintInfo.freezeAuthority?.toBase58() || null,
        updateAuthority,
        hasMintAuthority,
        hasFreezeAuthority,
        hasUpdateAuthority,
        canRevokeMint: hasMintAuthority,
        canRevokeFreeze: hasFreezeAuthority,
        canRevokeUpdate: hasUpdateAuthority,
      };

      setAuthorities(authResult);
      setTokenInfo({
        isToken2022,
        decimals: mintInfo.decimals,
        supply: (Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toLocaleString(),
        programId,
      });

      if (!hasMintAuthority && !hasFreezeAuthority && !hasUpdateAuthority) {
        setError('no_authority');
      }
    } catch (err) {
      setAuthorities(null);
      setTokenInfo(null);
      setError(err instanceof Error ? err.message : 'Failed to check token');
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
        setError(null);
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
    error,
    refetch: checkAuthorities,
  };
}
