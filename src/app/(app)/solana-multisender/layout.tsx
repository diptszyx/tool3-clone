import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solana  Multisender | Airdrop Tool | Fast & Cheap',
  description:
    'The best Solana Multisender, Batch Sender, Bulk Sender, and Airdrop Tool to help you send SPL tokens and Solana to multiple addresses.',
};

export default function SolanaMultisenderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
