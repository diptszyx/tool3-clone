import WalletMigrationContainer from '@/components/wallet-asset-migration/asset-migration';
import SuspenseLayout from '@/components/suspense-layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WalletMigration',
  description: 'WalletMigration',
};

export default function WalletMigration() {
  return (
    <div className=" flex md:items-center mt-10 md:mt-0">
      <div className="container mx-auto px-4">
        <SuspenseLayout>
          <WalletMigrationContainer />
        </SuspenseLayout>
      </div>
    </div>
  );
}
