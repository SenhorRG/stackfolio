'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { SKILL_LEVELS } from '@stackfolio/shared';
import { Input } from '@/components/ui/input';
import { RemoveSkillFromProfile } from '@/features/skills/components/remove-skill-from-profile';
import { ProfileSkillCategorySelect } from '@/features/profiles/components/profile-skill-category-select';
import { profileSkillResourceCategories } from '@/features/profiles/lib/profile-skill-categories';
import {
  sortProfileSkillRows,
  type ProfileSkillSortColumn,
  type ProfileSkillSortDirection,
} from '@/features/profiles/lib/sort-profile-skill-rows';

export type ProfileSkillRow = {
  skillId: string;
  level: string;
  years: number | null;
  highlight: boolean;
  displayCategory: string | null;
  skill: {
    name: string;
    slug: string;
    category: string;
    categories?: string[];
  };
};

type SkillUpdatePayload = {
  skillId: string;
  level: string;
  years?: number | null;
  highlight?: boolean;
  displayCategory?: string | null;
};

type Props = {
  profileId: string;
  token?: string;
  skills: ProfileSkillRow[];
  disabled?: boolean;
  onUpdate: (entry: SkillUpdatePayload) => void;
};

type SortState = {
  column: ProfileSkillSortColumn;
  direction: ProfileSkillSortDirection;
};

const DEFAULT_SORT: SortState = { column: 'skill', direction: 'asc' };

function SortableHeader({
  label,
  column,
  sort,
  onSort,
}: {
  label: string;
  column: ProfileSkillSortColumn;
  sort: SortState;
  onSort: (column: ProfileSkillSortColumn) => void;
}) {
  const active = sort.column === column;
  const Icon = !active
    ? ArrowUpDown
    : sort.direction === 'asc'
      ? ArrowUp
      : ArrowDown;

  return (
    <th className="px-3 py-2 font-medium">
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1.5 hover:text-foreground"
        aria-label={`Sort by ${label}`}
        aria-sort={
          active
            ? sort.direction === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none'
        }
      >
        {label}
        <Icon className="size-3.5 opacity-70" aria-hidden />
      </button>
    </th>
  );
}

export function ProfileSkillsTable({
  profileId,
  token,
  skills,
  disabled,
  onUpdate,
}: Props) {
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

  const sortedSkills = useMemo(
    () => sortProfileSkillRows(skills, sort.column, sort.direction),
    [skills, sort.column, sort.direction],
  );

  function handleSort(column: ProfileSkillSortColumn) {
    setSort((current) => {
      if (current.column === column) {
        return {
          column,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return { column, direction: 'asc' };
    });
  }

  if (!skills.length) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No skills on this profile yet. Add a skill above to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left">
            <SortableHeader
              label="Skill"
              column="skill"
              sort={sort}
              onSort={handleSort}
            />
            <SortableHeader
              label="Category"
              column="category"
              sort={sort}
              onSort={handleSort}
            />
            <SortableHeader
              label="Level"
              column="level"
              sort={sort}
              onSort={handleSort}
            />
            <SortableHeader
              label="Years"
              column="years"
              sort={sort}
              onSort={handleSort}
            />
            <th className="px-3 py-2 font-medium">Highlight</th>
            <th className="px-3 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedSkills.map((pt) => {
            const resourceCategories = profileSkillResourceCategories(pt.skill);
            const payload = {
              skillId: pt.skillId,
              level: pt.level,
              years: pt.years,
              highlight: pt.highlight,
              displayCategory: pt.displayCategory,
            };

            return (
              <tr key={pt.skillId} className="border-b last:border-b-0">
                <td className="px-3 py-2 font-medium">{pt.skill.name}</td>
                <td className="px-3 py-2">
                  <ProfileSkillCategorySelect
                    categories={resourceCategories}
                    value={pt.displayCategory}
                    disabled={disabled}
                    compact
                    onChange={(displayCategory) =>
                      onUpdate({ ...payload, displayCategory })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={pt.level}
                    disabled={disabled}
                    onChange={(e) =>
                      onUpdate({ ...payload, level: e.target.value })
                    }
                    className="w-full min-w-[8rem] rounded border px-2 py-1"
                    aria-label={`Level for ${pt.skill.name}`}
                  >
                    {SKILL_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    className="w-20"
                    defaultValue={pt.years ?? ''}
                    disabled={disabled}
                    aria-label={`Years for ${pt.skill.name}`}
                    onBlur={(e) =>
                      onUpdate({
                        ...payload,
                        years: Number(e.target.value) || null,
                      })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={pt.highlight}
                      disabled={disabled}
                      onChange={(e) =>
                        onUpdate({ ...payload, highlight: e.target.checked })
                      }
                    />
                    <span className="sr-only">Highlight {pt.skill.name}</span>
                  </label>
                </td>
                <td className="px-3 py-2 text-right">
                  {token ? (
                    <RemoveSkillFromProfile
                      profileId={profileId}
                      skillId={pt.skillId}
                      skillName={pt.skill.name}
                      token={token}
                    />
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
