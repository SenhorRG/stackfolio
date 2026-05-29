'use client';

import { formatSkillCategoryLabel } from '@stackfolio/shared';

type Props = {
  categories: string[];
  value: string | null;
  disabled?: boolean;
  compact?: boolean;
  onChange: (category: string | null) => void;
};

export function ProfileSkillCategorySelect({
  categories,
  value,
  disabled,
  compact,
  onChange,
}: Props) {
  const selected =
    value && categories.includes(value) ? value : categories[0] ?? null;

  const select = (
    <select
      value={selected ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full min-w-[8rem] rounded border px-2 py-1"
      aria-label="Default resume category"
    >
      {categories.map((category) => (
        <option key={category} value={category}>
          {formatSkillCategoryLabel(category)}
        </option>
      ))}
    </select>
  );

  if (compact) return select;

  return (
    <label className="flex flex-col gap-1 text-sm">
      {select}
    </label>
  );
}
