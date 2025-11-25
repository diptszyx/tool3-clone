// const HELIUS_URL = process.env.NEXT_PUBLIC_RPC_MAINNET!;

// export const heliusClient = {
//   async getTokenHolders(mintAddress: string) {
//     let cursor: string | undefined = undefined;
//     const allTokenAccounts: any[] = [];
//     let totalExpected = 0;

//     while (true) {
//       const params: any = {
//         mint: mintAddress,
//         limit: 1000,
//       };

//       if (cursor) {
//         params.cursor = cursor;
//       }

//       const response = await fetch(HELIUS_URL, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           jsonrpc: '2.0',
//           id: '1',
//           method: 'getTokenAccounts',
//           params: params,
//         }),
//       });

//       const data = await response.json();
//       if (data.error) throw new Error(data.error.message || 'Failed to fetch token accounts');

//       const result = data.result;
//       const tokenAccounts = result?.token_accounts || [];
//       totalExpected = result?.total || 0;

//       if (tokenAccounts.length === 0) break;
//       allTokenAccounts.push(...tokenAccounts);

//       const nextCursor = result?.cursor;
//       if (!nextCursor || allTokenAccounts.length >= totalExpected) break;

//       cursor = nextCursor;

//       if (allTokenAccounts.length > 100000) break;
//     }

//     return allTokenAccounts;
//   },

//   async getNFTsByCollection(collectionAddress: string) {
//     let page = 1;
//     const allAssets: any[] = [];

//     while (true) {
//       const response = await fetch(HELIUS_URL, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           jsonrpc: '2.0',
//           id: '1',
//           method: 'getAssetsByGroup',
//           params: {
//             groupKey: 'collection',
//             groupValue: collectionAddress,
//             page: page,
//             limit: 1000,
//           },
//         }),
//       });

//       const data = await response.json();
//       if (data.error) throw new Error(data.error.message || 'Failed to fetch NFTs');

//       const items = data.result?.items || [];
//       if (items.length === 0) break;

//       allAssets.push(...items);
//       if (items.length < 1000) break;

//       page++;
//       if (page > 1000) break;
//     }

//     return allAssets;
//   },

//   async getNFTsByCreator(creatorAddress: string) {
//     let page = 1;
//     const allAssets: any[] = [];

//     while (true) {
//       const response = await fetch(HELIUS_URL, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           jsonrpc: '2.0',
//           id: '1',
//           method: 'getAssetsByCreator',
//           params: {
//             creatorAddress: creatorAddress,
//             onlyVerified: true,
//             page: page,
//             limit: 1000,
//           },
//         }),
//       });

//       const data = await response.json();
//       if (data.error) throw new Error(data.error.message || 'Failed to fetch NFTs');

//       const items = data.result?.items || [];
//       if (items.length === 0) break;

//       allAssets.push(...items);
//       if (items.length < 1000) break;

//       page++;
//       if (page > 1000) break;
//     }

//     return allAssets;
//   },

//   async getTokenInfo(mintAddress: string) {
//     const response = await fetch(HELIUS_URL, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         jsonrpc: '2.0',
//         id: '1',
//         method: 'getAsset',
//         params: { id: mintAddress },
//       }),
//     });

//     const data = await response.json();
//     if (data.error) throw new Error(data.error.message || 'Failed to fetch token info');

//     return data.result;
//   },
// };
