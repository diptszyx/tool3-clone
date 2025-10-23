import WalletManagerContainer from '@/components/local-wallet-manager/wallet-manager';
import SuspenseLayout from '@/components/suspense-layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WalletManagerContainer',
  description: 'WalletManagerContainer',
};

export default function WalletManager() {
  return (
    <div className=" flex md:items-center mt-10 md:mt-0">
      <div className="container mx-auto px-4">
        <SuspenseLayout>
          <WalletManagerContainer />
        </SuspenseLayout>
      </div>
    </div>
  );
}
