// 'use client';

// import { useState } from 'react';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Loader2, Download } from 'lucide-react';
// import { useSnapshot } from '@/hooks/use-snapshot';
// import { exportTokenHoldersToCSV, exportNFTHoldersToCSV } from '@/utils/export-csv';
// import { useIsMobile } from '@/hooks/use-mobile';

// export default function SnapshotTool() {
//   const [tokenAddress, setTokenAddress] = useState('');
//   const [nftAddress, setNFTAddress] = useState('');
//   const [nftType, setNFTType] = useState<'collection' | 'creator'>('collection');
//   const isMobile = useIsMobile();
//   const {
//     loading,
//     error,
//     tokenHolders,
//     nftHolders,
//     fetchTokenSnapshot,
//     fetchNFTSnapshotByCollection,
//     fetchNFTSnapshotByCreator,
//   } = useSnapshot();

//   const handleTokenSnapshot = () => {
//     if (tokenAddress.trim()) {
//       fetchTokenSnapshot(tokenAddress.trim());
//     }
//   };

//   const handleNFTSnapshot = () => {
//     if (nftAddress.trim()) {
//       if (nftType === 'collection') {
//         fetchNFTSnapshotByCollection(nftAddress.trim());
//       } else {
//         fetchNFTSnapshotByCreator(nftAddress.trim());
//       }
//     }
//   };

//   return (
//     <div className={`max-h-[calc(100vh-100px)] overflow-y-auto ${isMobile ? 'py-2' : 'py-6'}`}>
//       <Card>
//         <CardHeader>
//           <CardTitle>Snapshot Tool</CardTitle>
//           <CardDescription>Take snapshot of token or NFT holders</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Tabs defaultValue="token" className="w-full">
//             <TabsList className="grid w-full grid-cols-2">
//               <TabsTrigger value="token">Token</TabsTrigger>
//               <TabsTrigger value="nft">NFT</TabsTrigger>
//             </TabsList>

//             <TabsContent value="token" className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="token-address">Token Mint Address</Label>
//                 <div className="flex gap-2">
//                   <Input
//                     id="token-address"
//                     placeholder="Enter token mint address..."
//                     value={tokenAddress}
//                     onChange={(e) => setTokenAddress(e.target.value)}
//                     onKeyDown={(e) => e.key === 'Enter' && handleTokenSnapshot()}
//                   />
//                   <Button onClick={handleTokenSnapshot} disabled={loading || !tokenAddress.trim()}>
//                     {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Snapshot'}
//                   </Button>
//                 </div>
//               </div>

//               {error && (
//                 <Alert variant="destructive">
//                   <AlertDescription>{error}</AlertDescription>
//                 </Alert>
//               )}

//               {tokenHolders.length > 0 && (
//                 <div className="space-y-4">
//                   <div className="flex justify-between items-center">
//                     <p className="text-sm text-muted-foreground">
//                       Total Holders: {tokenHolders.length}
//                     </p>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() => exportTokenHoldersToCSV(tokenHolders)}
//                     >
//                       <Download className="h-4 w-4 mr-2" />
//                       Export CSV
//                     </Button>
//                   </div>

//                   <div className="border rounded-lg max-h-[500px] overflow-auto">
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           <TableHead className="w-[100px]">#</TableHead>
//                           <TableHead>Wallet Address</TableHead>
//                           <TableHead className="text-right">Balance</TableHead>
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {tokenHolders.map((holder, index) => (
//                           <TableRow key={holder.address}>
//                             <TableCell className="font-medium">{index + 1}</TableCell>
//                             <TableCell className="font-mono text-sm">{holder.address}</TableCell>
//                             <TableCell className="text-right">
//                               {holder.balance.toLocaleString()}
//                             </TableCell>
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </div>
//                 </div>
//               )}
//             </TabsContent>

//             <TabsContent value="nft" className="space-y-4">
//               <div className="space-y-2">
//                 <Label>NFT Type</Label>
//                 <div className="flex gap-2">
//                   <Button
//                     variant={nftType === 'collection' ? 'default' : 'outline'}
//                     onClick={() => setNFTType('collection')}
//                     size="sm"
//                   >
//                     Collection
//                   </Button>
//                   <Button
//                     variant={nftType === 'creator' ? 'default' : 'outline'}
//                     onClick={() => setNFTType('creator')}
//                     size="sm"
//                   >
//                     Creator
//                   </Button>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="nft-address">
//                   {nftType === 'collection' ? 'Collection Address' : 'Creator Address'}
//                 </Label>
//                 <div className="flex gap-2">
//                   <Input
//                     id="nft-address"
//                     placeholder={`Enter ${nftType} address...`}
//                     value={nftAddress}
//                     onChange={(e) => setNFTAddress(e.target.value)}
//                     onKeyDown={(e) => e.key === 'Enter' && handleNFTSnapshot()}
//                   />
//                   <Button onClick={handleNFTSnapshot} disabled={loading || !nftAddress.trim()}>
//                     {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Snapshot'}
//                   </Button>
//                 </div>
//               </div>

//               {error && (
//                 <Alert variant="destructive">
//                   <AlertDescription>{error}</AlertDescription>
//                 </Alert>
//               )}

//               {nftHolders.length > 0 && (
//                 <div className="space-y-4">
//                   <div className="flex justify-between items-center">
//                     <p className="text-sm text-muted-foreground">
//                       Total Holders: {nftHolders.length}
//                     </p>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() => exportNFTHoldersToCSV(nftHolders)}
//                     >
//                       <Download className="h-4 w-4 mr-2" />
//                       Export CSV
//                     </Button>
//                   </div>

//                   <div className="border rounded-lg max-h-[500px] overflow-auto">
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           <TableHead className="w-[100px]">#</TableHead>
//                           <TableHead>Wallet Address</TableHead>
//                           <TableHead className="text-right">NFT Count</TableHead>
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {nftHolders.map((holder, index) => (
//                           <TableRow key={holder.address}>
//                             <TableCell className="font-medium">{index + 1}</TableCell>
//                             <TableCell className="font-mono text-sm">{holder.address}</TableCell>
//                             <TableCell className="text-right">{holder.count}</TableCell>
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </div>
//                 </div>
//               )}
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
