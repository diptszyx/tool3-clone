import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { WalletInfo } from '@/lib/increase/types';

export const exportWalletsToExcel = (wallets: WalletInfo[]): void => {
  const data = wallets.map((w) => ({
    Address: w.publicKey,
    PrivateKey: w.secretKey,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [{ wch: 42 }, { wch: 64 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Wallets');

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/octet-stream',
  });

  saveAs(blob, 'wallets.xlsx');
};
