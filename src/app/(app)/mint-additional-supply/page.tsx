import type { Metadata } from 'next';
import MintForm from '@/components/mint-additional-supply/mint-token-form';

export const metadata: Metadata = {
  title: 'Mint Additional Supply',
  description: '',
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
