import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { WalletInfo, TokenInfo } from '@/lib/increase/types';

interface WalletTableProps {
  wallets: WalletInfo[] | null;
  selectedToken: TokenInfo | null;
}

export const WalletTable = ({ wallets, selectedToken }: WalletTableProps) => {
  return (
    <Card>
      <div className="h-[200px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-white">
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>SOL balance</TableHead>
              <TableHead>{selectedToken?.symbol} balance</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallets?.map((wallet, index) => (
              <TableRow key={wallet.publicKey}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-mono text-xs break-all">
                  <a
                    href={`https://solscan.io/account/${wallet.publicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {wallet.publicKey}
                  </a>
                </TableCell>
                <TableCell>{wallet.solAmount?.toFixed(4) ?? '0'} SOL</TableCell>
                <TableCell>
                  {wallet.tokenBalances
                    ?.find((t) => t.mint === selectedToken?.id)
                    ?.amount?.toFixed(4) ?? '-'}
                </TableCell>
                <TableCell>
                  {wallet.result === 'success'
                    ? 'Success'
                    : wallet.result === 'failed'
                      ? 'Failed'
                      : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
