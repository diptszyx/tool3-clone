import { useMemo } from 'react';
import { Connection } from '@solana/web3.js';
import { useNetwork } from '@/context/NetworkContext';
import { connectionMainnet, connectionDevnet } from '@/service/solana/connection';

export const useConnection = (): Connection => {
  const { network } = useNetwork();

  return useMemo(() => {
    return network === 'devnet' ? connectionDevnet : connectionMainnet;
  }, [network]);
};
