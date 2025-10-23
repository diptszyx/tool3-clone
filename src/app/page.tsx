import TransferForm from '@/components/transfer/transfer-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solana Gasless Token Transfer',
  description: 'Easily transfer tokens without requiring SOL in your wallet.',
};

export default function Home() {
  return (
    <div className="h-full flex md:items-center mt-10 md:mt-0">
      <div className="container mx-auto px-4">
        <TransferForm />
      </div>
    </div>
  );
}
