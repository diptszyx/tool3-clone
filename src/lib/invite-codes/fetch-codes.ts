import Papa from 'papaparse';
import { InviteCodeData } from '@/types/invite-code';

const SHEET_URL = process.env.NEXT_PUBLIC_INVITE_CODES_URL!;

export async function fetchInviteCodes(): Promise<Map<string, InviteCodeData>> {
  try {
    const response = await fetch(SHEET_URL, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch invite codes');
    }

    const csvText = await response.text();

    const parsed = Papa.parse<string[]>(csvText, {
      header: false,
      skipEmptyLines: true,
    });

    const codesMap = new Map<string, InviteCodeData>();

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];

      if (row.length < 4) continue;

      const [code, featuresStr, expiresAt, url] = row;

      if (!code || !featuresStr) continue;

      const features = featuresStr
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      codesMap.set(code.toLowerCase().trim(), {
        code: code.trim(),
        features,
        expiresAt: expiresAt.toLowerCase() === 'permanent' ? null : expiresAt.trim(),
        url: url.trim(),
      });
    }

    return codesMap;
  } catch (error) {
    console.error('Error fetching invite codes:', error);
    return new Map();
  }
}
