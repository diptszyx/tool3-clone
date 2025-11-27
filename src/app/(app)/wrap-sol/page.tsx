import WrapSolForm from '@/components/wrap-sol-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wrap SOL',
  description: 'Easily wrap or unwrap Solana without Coding.',
};

export default function SwapSol() {
  return (
    <div className="h-full flex md:items-center mt-10 md:mt-0">
      <div className="container mx-auto px-4">
        <WrapSolForm />
      </div>
    </div>
  );
}
