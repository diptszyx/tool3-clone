import PoolForm from '@/components/dbc/token';
import SuspenseLayout from '@/components/suspense-layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Launch Your Token with DBC on Metora | Solana Bonding Curve',
  description:
    'Launch your Solana token using Metora Dynamic Bonding Curve (DBC). Create a fair, automated token launch with real-time price discovery and seamless liquidity distribution.',
};

export default function PoolKey() {
  return (
    <div className="h-full flex md:items-center mt-10 md:mt-0">
      <div className="container mx-auto px-4">
        <SuspenseLayout>
          <PoolForm />
        </SuspenseLayout>
      </div>
    </div>
  );
}
