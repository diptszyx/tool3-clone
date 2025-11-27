import CloneTokenForm from '@/components/clone-token/clone-token-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clone Token',
  description:
    'Solana token cloning tool allows you to quickly copy and fork token data to launch new projects instantly, enhancing market responsiveness.',
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
