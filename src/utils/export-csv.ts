import { TokenHolder, NFTHolder } from '@/types/snapshot';

export function exportTokenHoldersToCSV(
  holders: TokenHolder[],
  filename: string = 'token-snapshot.csv',
) {
  const headers = ['Wallet Address', 'Balance'];
  const rows = holders.map((h) => [h.address, h.balance.toString()]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  downloadCSV(csv, filename);
}

export function exportNFTHoldersToCSV(holders: NFTHolder[], filename: string = 'nft-snapshot.csv') {
  const headers = ['Wallet Address', 'NFT Count'];
  const rows = holders.map((h) => [h.address, h.count.toString()]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  downloadCSV(csv, filename);
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
