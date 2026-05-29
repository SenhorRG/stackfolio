import {
  parseProfileIdentity,
  profileHasFilledData,
  type ProfileIdentity,
} from '@stackfolio/shared';

export function clientProfileHasFilledData(params: {
  profileData: unknown;
  skillsCount: number;
}): boolean {
  return profileHasFilledData({
    ...params,
    parseIdentity: (data) => parseProfileIdentity(data) as ProfileIdentity,
  });
}
