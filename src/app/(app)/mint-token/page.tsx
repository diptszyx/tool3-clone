import type { Metadata } from 'next';
import MintForm from '@/components/mint-token/mint-token-form';

export const metadata: Metadata = {
  title: 'Mint Solana Token Supply | No-Code & Cheap | Tool3',
  description:
    'The best an faster way to mint more supply of an SPL Token. No-Code solution created by Tool3',
};

export default function MintToken() {
  return (
    <div className="h-full flex md:items-center mt-10 md:mt-0">
      <div className="container mx-auto px-4">
        <MintForm />
      </div>
    </div>
  );
}
