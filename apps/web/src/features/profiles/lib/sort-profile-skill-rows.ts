import {
  resolveProfileSkillDisplayCategory,
  SKILL_LEVELS,
  type SkillLevelValue,
} from '@stackfolio/shared';
import type { ProfileSkillRow } from '@/features/profiles/components/profile-skills-table';

export type ProfileSkillSortColumn = 'skill' | 'category' | 'level' | 'years';
export type ProfileSkillSortDirection = 'asc' | 'desc';

const LEVEL_RANK = new Map<string, number>(
  SKILL_LEVELS.map((level, index) => [level, index]),
);

function compareNullableNumbers(
  left: number | null,
  right: number | null,
): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return left - right;
}

export function sortProfileSkillRows(
  rows: ProfileSkillRow[],
  column: ProfileSkillSortColumn,
  direction: ProfileSkillSortDirection,
): ProfileSkillRow[] {
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
    let comparison = 0;

    switch (column) {
      case 'skill':
        comparison = left.skill.name.localeCompare(right.skill.name, undefined, {
          sensitivity: 'base',
        });
        break;
      case 'category':
        comparison = resolveProfileSkillDisplayCategory(left).localeCompare(
          resolveProfileSkillDisplayCategory(right),
          undefined,
          { sensitivity: 'base' },
        );
        break;
      case 'level':
        comparison =
          (LEVEL_RANK.get(left.level) ?? -1) -
          (LEVEL_RANK.get(right.level as SkillLevelValue) ?? -1);
        break;
      case 'years':
        comparison = compareNullableNumbers(left.years, right.years);
        break;
    }

    return comparison * multiplier;
  });
}
