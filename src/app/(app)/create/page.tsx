import { TokenCreationForm } from '@/components/token-creation-form';
import SuspenseLayout from '@/components/suspense-layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create SPL Tokens and Token2022 on Solana',
  description:
    'Create Solana tokens effortlessly with no coding required. Fast, affordable, and user-friendly.',
};

export default function CreateToken() {
  return (
    <div className="h-full flex md:items-center mt-3 sm:mt-10 md:mt-0">
      <div className="container mx-auto px-4 max-h-[calc(100vh-60px)]">
        <ScrollArea className="h-[calc(100vh-80px)]">
          <SuspenseLayout>
            <TokenCreationForm />
          </SuspenseLayout>
        </ScrollArea>
      </div>
    </div>
  );
}
