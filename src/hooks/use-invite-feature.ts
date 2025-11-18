import { useState, useEffect } from 'react';
import { getSavedInviteCode } from '@/lib/invite-codes/helpers';

export function useInviteFeature(featureName: string): boolean {
  const [isFree, setIsFree] = useState(false);

  useEffect(() => {
    const checkInvite = () => {
      const saved = getSavedInviteCode();

      if (!saved) {
        setIsFree(false);
        return;
      }

      const hasFeature = saved.features.includes(featureName);
      if (!hasFeature) {
        setIsFree(false);
        return;
      }

      if (saved.expiresAt === null) {
        setIsFree(true);
        return;
      }

      const parseDate = (dateStr: string): Date => {
        if (dateStr.includes('-')) {
          return new Date(dateStr);
        }

        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/');
          return new Date(`${year}-${month}-${day}`);
        }

        return new Date(dateStr);
      };

      try {
        const expiresDate = parseDate(saved.expiresAt);
        const now = new Date();

        expiresDate.setHours(23, 59, 59, 999);

        setIsFree(now < expiresDate);
      } catch (error) {
        console.error('Error parsing expires date:', error);
        setIsFree(false);
      }
    };

    checkInvite();

    window.addEventListener('invite-code-activated', checkInvite);
    window.addEventListener('storage', checkInvite);

    return () => {
      window.removeEventListener('invite-code-activated', checkInvite);
      window.removeEventListener('storage', checkInvite);
    };
  }, [featureName]);

  return isFree;
}
