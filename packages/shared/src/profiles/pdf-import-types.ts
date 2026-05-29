import type { ProfileIdentity } from '../entities/profile-identity';

export type ParsedProfileFromPdf = {
  identity: ProfileIdentity;
  skillNames: string[];
  warnings: string[];
  /** Full name detected in the CV header (maps to profile.name when importing). */
  suggestedProfileName?: string;
};
