import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solana Multisender - Tool3',
  description:
    'Send SOL and SPL tokens to multiple recipients simultaneously with our powerful Solana multisender tool. Batch transfer tokens efficiently with CSV import support.',
};

export default function SolanaMultisenderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
