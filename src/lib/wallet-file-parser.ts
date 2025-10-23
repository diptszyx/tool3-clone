import * as XLSX from 'xlsx';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

export type SupportedFileExtension = '.csv' | '.txt' | '.json' | '.xlsx' | '.xls';

export const VALID_FILE_TYPES: SupportedFileExtension[] = [
  '.csv',
  '.txt',
  '.json',
  '.xlsx',
  '.xls',
];
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function isValidSolanaPrivateKey(key: string): boolean {
  const trimmed = key.trim();
  try {
    if (trimmed.length < 80 || trimmed.length > 90) return false;
    const decoded = bs58.decode(trimmed);
    if (decoded.length !== 64) return false;
    Keypair.fromSecretKey(decoded);
    return true;
  } catch {
    return false;
  }
}

export function convertPrivateKeyToAddress(
  privateKey: string,
): { address: string; privateKey: string } | null {
  try {
    const decoded = bs58.decode(privateKey.trim());
    const keypair = Keypair.fromSecretKey(decoded);
    return { address: keypair.publicKey.toBase58(), privateKey: privateKey.trim() };
  } catch {
    return null;
  }
}

export function getFileExtension(fileName: string): string {
  return fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const ext = getFileExtension(file.name);
  if (!VALID_FILE_TYPES.includes(ext as SupportedFileExtension)) {
    return { valid: false, error: 'Invalid file type. Supported: CSV, TXT, JSON, Excel' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 5MB' };
  }
  return { valid: true };
}

interface WalletJSON {
  privateKey?: string;
}

function parseJSON(text: string): string[] {
  const json = JSON.parse(text);
  if (Array.isArray(json)) {
    return json.filter((v: unknown): v is string => typeof v === 'string' && v.trim().length > 0);
  }

  if (
    typeof json === 'object' &&
    json &&
    Array.isArray((json as { wallets?: WalletJSON[] }).wallets)
  ) {
    return (json as { wallets: WalletJSON[] }).wallets
      .map((w) => w.privateKey || '')
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  }

  return [];
}

function parseCSV_TXT(text: string): string[] {
  return text
    .split(/[\r\n]+/)
    .map((r) => r.trim())
    .filter((r) => r && r !== 'privateKey' && r.toLowerCase() !== 'privatekey');
}

async function parseExcel(file: File): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[] | Record<string, string>>(sheet, { header: 1 });

  if (rows.length === 0) return [];

  const firstRow = rows[0];
  const hasHeader =
    Array.isArray(firstRow) &&
    firstRow.some((cell) => typeof cell === 'string' && cell.toLowerCase().includes('privatekey'));

  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((row) => {
      if (Array.isArray(row)) return row[0];
      if (typeof row === 'object' && row !== null && 'privateKey' in row)
        return (row as Record<string, string>).privateKey;
      return typeof row === 'string' ? row : '';
    })
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim());
}

export async function parseWalletFile(file: File): Promise<string[]> {
  const ext = getFileExtension(file.name) as SupportedFileExtension;
  switch (ext) {
    case '.json':
      return parseJSON(await file.text());
    case '.csv':
    case '.txt':
      return parseCSV_TXT(await file.text());
    case '.xlsx':
    case '.xls':
      return parseExcel(file);
    default:
      return [];
  }
}

export function generateTemplateContent(format: 'csv' | 'txt' | 'json') {
  const exampleKeys = [
    '3hz1gCrtibL2ppspeLcqcXtvfupF4guKJ153eXkodyR2FdrdjEPxXHXvKDKKQ7a4GwGgV9551c8r4nz1q1ksp8JW',
    '2mK8pDqWxYc3vN9fH7jL5tR6sB4aE1wQ8xF3yG9zC5vD7hJ6kN4mP2rT8sV1wX3yA5bC7dE9fH1jK3mN5pQ7rS',
  ];
  const templates = {
    csv: 'privateKey\n' + exampleKeys.join('\n'),
    txt: exampleKeys.join('\n'),
    json: JSON.stringify(exampleKeys, null, 2),
  };
  return templates[format];
}

export function downloadTemplate(format: 'csv' | 'txt' | 'json' | 'xlsx') {
  const exampleKeys = [
    '3hz1gCrtibL2ppspeLcqcXtvfupF4guKJ153eXkodyR2FdrdjEPxXHXvKDKKQ7a4GwGgV9551c8r4nz1q1ksp8JW',
    '2mK8pDqWxYc3vN9fH7jL5tR6sB4aE1wQ8xF3yG9zC5vD7hJ6kN4mP2rT8sV1wX3yA5bC7dE9fH1jK3mN5pQ7rS',
  ];

  if (format === 'xlsx') {
    const data = [['privateKey'], ...exampleKeys.map((k) => [k])];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Wallets');
    XLSX.writeFile(wb, 'wallet-import-template.xlsx');
    return;
  }

  const content = generateTemplateContent(format);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wallet-import-template.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
