// import { useState } from 'react';
// import { heliusClient } from '@/lib/helius';
// import { TokenHolder, NFTHolder } from '@/types/snapshot';

// export function useSnapshot() {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [tokenHolders, setTokenHolders] = useState<TokenHolder[]>([]);
//   const [nftHolders, setNFTHolders] = useState<NFTHolder[]>([]);

//   const fetchTokenSnapshot = async (mintAddress: string) => {
//     setLoading(true);
//     setError(null);
//     setTokenHolders([]);

//     try {
//       const tokenInfo = await heliusClient.getTokenInfo(mintAddress);
//       const decimals = tokenInfo?.token_info?.decimals || 0;

//       const tokenAccounts = await heliusClient.getTokenHolders(mintAddress);

//       if (tokenAccounts.length === 0) {
//         setError('No holders found for this token');
//         return;
//       }

//       const holdersMap = new Map<string, number>();

//       tokenAccounts.forEach((account: any) => {
//         const owner = account.owner;
//         const amount = account.amount || 0;
//         const actualBalance = amount / Math.pow(10, decimals);

//         if (owner && amount > 0) {
//           holdersMap.set(owner, (holdersMap.get(owner) || 0) + actualBalance);
//         }
//       });

//       const holders: TokenHolder[] = Array.from(holdersMap.entries())
//         .map(([address, balance]) => ({ address, balance }))
//         .filter((h) => h.balance > 0)
//         .sort((a, b) => b.balance - a.balance);

//       setTokenHolders(holders);
//     } catch (err) {
//       console.error('Error fetching token snapshot:', err);
//       setError(err instanceof Error ? err.message : 'Failed to fetch token holders');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchNFTSnapshotByCollection = async (collectionAddress: string) => {
//     setLoading(true);
//     setError(null);
//     setNFTHolders([]);

//     try {
//       const assets = await heliusClient.getNFTsByCollection(collectionAddress);

//       if (assets.length === 0) {
//         setError('No NFTs found for this collection');
//         return;
//       }

//       const holdersMap = new Map<string, number>();

//       assets.forEach((asset: any) => {
//         const owner = asset.ownership?.owner;
//         if (owner) {
//           holdersMap.set(owner, (holdersMap.get(owner) || 0) + 1);
//         }
//       });

//       const holders: NFTHolder[] = Array.from(holdersMap.entries())
//         .map(([address, count]) => ({ address, count }))
//         .sort((a, b) => b.count - a.count);

//       setNFTHolders(holders);
//     } catch (err) {
//       console.error('Error fetching NFT snapshot:', err);
//       setError(err instanceof Error ? err.message : 'Failed to fetch NFT holders');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchNFTSnapshotByCreator = async (creatorAddress: string) => {
//     setLoading(true);
//     setError(null);
//     setNFTHolders([]);

//     try {
//       const assets = await heliusClient.getNFTsByCreator(creatorAddress);

//       if (assets.length === 0) {
//         setError('No NFTs found for this creator');
//         return;
//       }

//       const holdersMap = new Map<string, number>();

//       assets.forEach((asset: any) => {
//         const owner = asset.ownership?.owner;
//         if (owner) {
//           holdersMap.set(owner, (holdersMap.get(owner) || 0) + 1);
//         }
//       });

//       const holders: NFTHolder[] = Array.from(holdersMap.entries())
//         .map(([address, count]) => ({ address, count }))
//         .sort((a, b) => b.count - a.count);

//       setNFTHolders(holders);
//     } catch (err) {
//       console.error('Error fetching NFT snapshot:', err);
//       setError(err instanceof Error ? err.message : 'Failed to fetch NFT holders');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return {
//     loading,
//     error,
//     tokenHolders,
//     nftHolders,
//     fetchTokenSnapshot,
//     fetchNFTSnapshotByCollection,
//     fetchNFTSnapshotByCreator,
//   };
// }
