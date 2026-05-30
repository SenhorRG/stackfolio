import { SkillLevel } from '@prisma/client';
import { serializeProfileForBackup } from './serialize-profile-for-backup';

describe('serializeProfileForBackup', () => {
  it('exports resolved skill categories and coerced profile identity', () => {
    const result = serializeProfileForBackup({
      id: 'profile-1',
      userId: 'user-1',
      name: 'Main',
      isMain: true,
      basedOnProfileId: null,
      profileData: {
        fullName: 'Alex',
        skillShowLevel: null,
        contact: { email: null, location: 'SP' },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      skills: [
        {
          profileId: 'profile-1',
          skillId: 'skill-1',
          level: SkillLevel.advanced,
          years: 2,
          highlight: false,
          displayCategory: null,
          skill: {
            id: 'skill-1',
            name: 'TypeScript',
            slug: 'typescript',
            category: 'languages',
            description: null,
            urls: null,
            resources: { categories: ['languages'] },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
    });

    expect(result.profileData.fullName).toBe('Alex');
    expect(result.profileData.contact.location).toBe('SP');
    expect(result.skills[0]?.displayCategory).toBe('Languages');
    expect(result.skills[0]?.displayCategory).not.toBeNull();
  });
});
