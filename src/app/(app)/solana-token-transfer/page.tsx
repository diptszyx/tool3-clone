import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Solana Token Transfer - Tool3',
  description:
    'Transfer SPL tokens on Solana blockchain with ease. Send tokens to single or multiple recipients with our comprehensive Solana token transfer solution.',
};

export default function SolanaTokenTransferPage() {
  redirect('/solana-multisender');
}
