import WalletMigration from '@/components/wallet-asset-migration/asset-migration';
import SuspenseLayout from '@/components/suspense-layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solana Wallet Migration | Multisender | Asset Consolidation',
  description:
    'Migrate tokens from multiple Solana wallets in one click. Simplify wallet cleanup and asset consolidation with an efficient multisender tool.',
};

export default function WalletMigrationPage() {
  return (
    <div className=" flex md:items-center mt-10 md:mt-0">
      <div className="container mx-auto px-4">
        <SuspenseLayout>
          <WalletMigration />
        </SuspenseLayout>
      </div>
    </div>
  );
}
