import { SavedInviteCode } from '@/types/invite-code';

const STORAGE_KEY = 'invite_code_data';

export function saveInviteCode(data: SavedInviteCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save invite code:', error);
  }
}

export function getSavedInviteCode(): SavedInviteCode | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get invite code:', error);
    return null;
  }
}

function parseDate(dateStr: string): Date {
  if (dateStr.includes('-')) {
    return new Date(dateStr);
  }

  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
  }

  return new Date(dateStr);
}

export function isFeatureFree(featureName: string): boolean {
  const saved = getSavedInviteCode();

  if (!saved) return false;

  if (!saved.features.includes(featureName)) return false;

  if (saved.expiresAt === null) return true;

  try {
    const expiresDate = parseDate(saved.expiresAt);
    const now = new Date();

    expiresDate.setHours(23, 59, 59, 999);

    return now < expiresDate;
  } catch (error) {
    console.error('Error parsing date:', error);
    return false;
  }
}

export function clearInviteCode(): void {
  localStorage.removeItem(STORAGE_KEY);
}
