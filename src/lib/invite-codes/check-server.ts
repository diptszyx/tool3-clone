import { fetchInviteCodes } from './fetch-codes';

export async function isFeatureFreeServer(
  featureName: string,
  inviteCode?: string,
): Promise<boolean> {
  if (!inviteCode) return false;

  try {
    const codesMap = await fetchInviteCodes();
    const codeData = codesMap.get(inviteCode.toLowerCase().trim());

    if (!codeData) return false;

    if (!codeData.features.includes(featureName)) return false;

    if (codeData.expiresAt === null) return true;

    const expiresDate = new Date(codeData.expiresAt);
    const now = new Date();

    return now < expiresDate;
  } catch (error) {
    console.error('Error checking invite code:', error);
    return false;
  }
}
