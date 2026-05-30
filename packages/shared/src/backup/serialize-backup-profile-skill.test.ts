import { describe, expect, it } from 'vitest';
import { serializeBackupProfileSkill } from './serialize-backup-profile-skill';

describe('serializeBackupProfileSkill', () => {
  it('exports effective category when displayCategory is null in DB', () => {
    const result = serializeBackupProfileSkill({
      level: 'advanced',
      years: 3,
      highlight: false,
      displayCategory: null,
      skill: {
        slug: 'react',
        name: 'React',
        category: 'frontend',
        resources: { categories: ['frontend', 'javascript'] },
      },
    });

    expect(result.displayCategory).toBe('Frontend');
    expect(result.displayCategory).not.toBeNull();
  });

  it('preserves explicit displayCategory from DB', () => {
    const result = serializeBackupProfileSkill({
      level: 'expert',
      years: 5,
      highlight: true,
      displayCategory: 'backend',
      skill: {
        slug: 'nodejs',
        name: 'Node.js',
        category: 'backend',
      },
    });

    expect(result.displayCategory).toBe('backend');
  });

  it('exports nullable years without forcing zero', () => {
    const result = serializeBackupProfileSkill({
      level: 'intermediate',
      years: null,
      highlight: false,
      displayCategory: 'devops',
      skill: {
        slug: 'docker',
        name: 'Docker',
        category: 'devops',
      },
    });

    expect(result.years).toBeNull();
  });
});
