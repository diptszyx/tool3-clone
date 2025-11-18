export interface InviteCodeData {
  code: string;
  features: string[];
  expiresAt: string | null;
  url: string;
}

export interface SavedInviteCode {
  code: string;
  features: string[];
  expiresAt: string | null;
  activatedAt: string;
}
