export const SkillLevel = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
} as const;

export type SkillLevelValue = (typeof SkillLevel)[keyof typeof SkillLevel];

export const SKILL_LEVELS = Object.values(SkillLevel);
