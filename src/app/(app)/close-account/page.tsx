import type { Metadata } from 'next';
import CloseAccountForm from '@/components/close-account/close-account-form';

export const metadata: Metadata = {
  title: 'Solana Close Account | Reclaim Solana',
  description:
    'Easily Reclaim Your Solana and Claim Your SOL with our seamless process. Use Solana close account to free up funds and optimize your wallet effortlessly.',
};

export default function CloseAccount() {
  return (
    <div className="h-full flex md:items-center mt-10 md:mt-0">
      <div className="container mx-auto px-4">
        <CloseAccountForm />
      </div>
    </div>
  );
}
