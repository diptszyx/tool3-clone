import CloneTokenForm from '@/components/clone-token/clone-token-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clone Token',
  description: 'Clone any token on Solana easily and quickly from your wallet.',
};

export default function CloneToken() {
  return (
    <div className="h-full flex md:items-center mt-10 md:mt-0">
      <div className="container mx-auto px-4">
        <CloneTokenForm />
      </div>
    </div>
  );
}
