import RevokeForm from '@/components/revoke/revoke-authority-form';
import SuspenseLayout from '@/components/suspense-layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Revoke Token Authority',
  description: 'Revoke mint, freeze, or update authority for your SPL tokens safely.',
};

export default function Revoke() {
  return (
    <div className="h-full flex md:items-center mt-10 md:mt-0">
      <div className="container mx-auto px-4">
        <SuspenseLayout>
          <RevokeForm />
        </SuspenseLayout>
      </div>
    </div>
  );
}
