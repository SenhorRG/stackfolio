import {
  parseProfileIdentity,
  type ProfileIdentity,
} from '../entities/profile-identity';

type ProfileNameSource = {
  name: string;
  profileData?: unknown;
  identity?: ProfileIdentity;
};

export function resolveProfilePersonName(source: ProfileNameSource): string {
  const identity =
    source.identity ?? parseProfileIdentity(source.profileData);
  const fromIdentity = identity.fullName?.trim();
  if (fromIdentity) return fromIdentity;
  return source.name.trim();
}
