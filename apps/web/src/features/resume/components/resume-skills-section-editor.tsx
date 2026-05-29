'use client';

import {
  SKILL_CATEGORY_CUSTOM,
  formatSkillCategoryLabel,
  profileSkillItems,
  skillCatalogCategories,
  type ProfileResumeSource,
  type ResumeSectionLayoutConfig,
  type SkillItemInput,
} from '@stackfolio/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formFieldId } from '@/lib/form-field-id';
import { ResumeSkillSearch } from './resume-skill-search';

type Props = {
  config: ResumeSectionLayoutConfig;
  profileSource: ProfileResumeSource | null;
  onChange: (config: ResumeSectionLayoutConfig) => void;
};

function getSkillItems(
  config: ResumeSectionLayoutConfig,
  profileSource: ProfileResumeSource | null,
): SkillItemInput[] {
  if (Array.isArray(config.items)) {
    return config.items as SkillItemInput[];
  }
  if (profileSource) return profileSkillItems(profileSource);
  return [];
}

function setSkillItems(
  config: ResumeSectionLayoutConfig,
  items: SkillItemInput[],
): ResumeSectionLayoutConfig {
  return { ...config, source: 'custom', items };
}

function categoryOptions(item: SkillItemInput): string[] {
  return [...new Set(skillCatalogCategories(item))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function categorySelectValue(
  item: SkillItemInput,
  options: string[],
): string {
  if (item.categoryIsCustom) return SKILL_CATEGORY_CUSTOM;
  const chosen = item.category?.trim();
  if (chosen && options.includes(chosen)) return chosen;
  if (options.length) return options[0];
  return SKILL_CATEGORY_CUSTOM;
}

function isCustomCategoryMode(
  item: SkillItemInput,
  options: string[],
): boolean {
  if (item.categoryIsCustom) return true;
  const chosen = item.category?.trim();
  if (!chosen) return false;
  return !options.includes(chosen);
}

export function ResumeSkillsSectionEditor({
  config,
  profileSource,
  onChange,
}: Props) {
  const items = getSkillItems(config, profileSource);

  const updateItem = (index: number, patch: Partial<SkillItemInput>) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    onChange(setSkillItems(config, next));
  };

  const removeItem = (index: number) => {
    onChange(setSkillItems(config, items.filter((_, i) => i !== index)));
  };

  return (
    <div className="space-y-3">
      <ResumeSkillSearch
        existingNames={items.map((item) => item.name)}
        onAdd={(skill) =>
          onChange(
            setSkillItems(config, [
              ...items,
              {
                name: skill.name,
                skillSlug: skill.skillSlug,
                level: skill.level ?? '',
                categories: skill.categories?.length
                  ? skill.categories
                  : skill.category
                    ? [skill.category]
                    : undefined,
                category: skill.categories?.[0] ?? skill.category,
                categoryIsCustom: false,
              },
            ]),
          )
        }
      />

      {items.map((item, index) => {
        const options = categoryOptions(item);
        const selectValue = categorySelectValue(item, options);
        const isCustom = isCustomCategoryMode(item, options);
        const customName = isCustom ? (item.category?.trim() ?? '') : '';
        const rowId = formFieldId('resume-skill', index);

        return (
          <div key={`${item.skillSlug ?? item.name}-${index}`} className="grid gap-2 rounded border p-2">
            <Input
              id={formFieldId(rowId, 'name')}
              name={formFieldId(rowId, 'name')}
              placeholder="Skill name"
              value={item.name}
              onChange={(e) => updateItem(index, { name: e.target.value })}
            />
            <Input
              id={formFieldId(rowId, 'level')}
              name={formFieldId(rowId, 'level')}
              placeholder="Level"
              value={String(item.level ?? '')}
              onChange={(e) => updateItem(index, { level: e.target.value })}
            />
            <Input
              id={formFieldId(rowId, 'years')}
              name={formFieldId(rowId, 'years')}
              placeholder="Years"
              type="number"
              value={item.years ?? ''}
              onChange={(e) =>
                updateItem(index, {
                  years: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
            <label className="text-xs" htmlFor={formFieldId(rowId, 'category')}>
              Category
              <select
                id={formFieldId(rowId, 'category')}
                name={formFieldId(rowId, 'category')}
                className="mt-1 w-full rounded border px-2 py-1"
                value={selectValue}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === SKILL_CATEGORY_CUSTOM) {
                    updateItem(index, {
                      categoryIsCustom: true,
                      category: customName,
                    });
                  } else {
                    updateItem(index, {
                      categoryIsCustom: false,
                      category: value,
                    });
                  }
                }}
              >
                {options.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatSkillCategoryLabel(cat)}
                  </option>
                ))}
                <option value={SKILL_CATEGORY_CUSTOM}>Custom</option>
              </select>
            </label>
            {isCustom && (
              <Input
                id={formFieldId(rowId, 'category-custom')}
                name={formFieldId(rowId, 'category-custom')}
                className="h-8 text-sm"
                placeholder="Custom category name"
                value={customName}
                onChange={(e) =>
                  updateItem(index, {
                    categoryIsCustom: true,
                    category: e.target.value,
                  })
                }
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
            >
              Remove
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange(
            setSkillItems(config, [
              ...items,
              { name: '', level: '', categoryIsCustom: false },
            ]),
          )
        }
      >
        Add skill manually
      </Button>
    </div>
  );
}
