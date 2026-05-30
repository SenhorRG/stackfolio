import {
  emptyProfileIdentity,
  parseProfileIdentity,
  profileIdentitySchema,
  type ProfileIdentity,
} from '../entities/profile-identity';
import { stripJsonNulls } from './strip-json-nulls';

/**
 * Coerces DB JSON into strict backup profile identity without dropping the row
 * when optional fields contain null (legacy rows).
 */
export function normalizeProfileIdentityForBackup(data: unknown): ProfileIdentity {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return emptyProfileIdentity();
  }

  const sanitized = stripJsonNulls(data);
  const parsed = profileIdentitySchema.safeParse(sanitized);
  if (parsed.success) return parsed.data;

  return parseProfileIdentity(sanitized);
}
