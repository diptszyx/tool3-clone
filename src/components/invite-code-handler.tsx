'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchInviteCodes } from '@/lib/invite-codes/fetch-codes';
import { saveInviteCode, getSavedInviteCode } from '@/lib/invite-codes/helpers';

export function InviteCodeHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const activateCode = async () => {
      const codeParam = searchParams.get('code');
      if (!codeParam) return;

      try {
        const codesMap = await fetchInviteCodes();
        const codeData = codesMap.get(codeParam.toLowerCase().trim());
        if (!codeData) return;

        if (codeData.expiresAt !== null) {
          const expiresDate = new Date(codeData.expiresAt);
          if (new Date() >= expiresDate) return;
        }

        const existing = getSavedInviteCode();
        const activatedAt =
          existing && existing.code.toLowerCase() === codeParam.toLowerCase()
            ? existing.activatedAt
            : new Date().toISOString();

        saveInviteCode({
          code: codeData.code,
          features: codeData.features,
          expiresAt: codeData.expiresAt,
          activatedAt: activatedAt,
        });

        window.dispatchEvent(new Event('invite-code-activated'));
        window.history.replaceState({}, '', window.location.pathname);
      } catch (error) {
        console.error('Error activating code:', error);
      }
    };

    activateCode();
  }, [searchParams]);

  useEffect(() => {
    const syncCode = async () => {
      const saved = getSavedInviteCode();
      if (!saved) return;

      try {
        const codesMap = await fetchInviteCodes();
        const codeData = codesMap.get(saved.code.toLowerCase());
        if (!codeData) return;

        const hasChanges =
          JSON.stringify(saved.features) !== JSON.stringify(codeData.features) ||
          saved.expiresAt !== codeData.expiresAt;

        if (hasChanges) {
          saveInviteCode({
            ...saved,
            features: codeData.features,
            expiresAt: codeData.expiresAt,
          });

          window.dispatchEvent(new Event('invite-code-activated'));
        }
      } catch (error) {
        console.error('Error syncing code:', error);
      }
    };

    syncCode();

    const interval = setInterval(syncCode, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
