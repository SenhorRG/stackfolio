'use client';

import type {
  ResumeSectionIdValue,
  ResumeSectionLayoutConfig,
} from '@stackfolio/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResumeSkillsSectionEditor } from './resume-skills-section-editor';
import type { ProfileResumeSource } from '@stackfolio/shared';
import { formFieldId } from '@/lib/form-field-id';

type ListItem = Record<string, unknown>;

type Props = {
  sectionId: ResumeSectionIdValue;
  config: ResumeSectionLayoutConfig;
  profileSource?: ProfileResumeSource | null;
  onChange: (config: ResumeSectionLayoutConfig) => void;
};

function getItems(config: ResumeSectionLayoutConfig): ListItem[] {
  return Array.isArray(config.items) ? (config.items as ListItem[]) : [];
}

function setItems(
  config: ResumeSectionLayoutConfig,
  items: ListItem[],
): ResumeSectionLayoutConfig {
  return { ...config, source: 'custom', items };
}

export function ResumeSectionContentEditor({
  sectionId,
  config,
  profileSource = null,
  onChange,
}: Props) {
  const items = getItems(config);

  const updateItem = (index: number, patch: ListItem) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(setItems(config, next));
  };

  const addItem = (empty: ListItem) => {
    onChange(setItems(config, [...items, empty]));
  };

  const removeItem = (index: number) => {
    onChange(setItems(config, items.filter((_, i) => i !== index)));
  };

  if (sectionId === 'skills') {
    return (
      <div className="mt-2 border-t pt-2 text-sm">
        <ResumeSkillsSectionEditor
          config={config}
          profileSource={profileSource}
          onChange={onChange}
        />
      </div>
    );
  }

  if (sectionId === 'experience') {
    return (
      <div className="mt-2 space-y-2 border-t pt-2 text-sm">
        {items.map((item, index) => {
          const bullets = (item.bullets as string[] | undefined) ?? [];
          const bulletText = bullets.join('\n');
          const rowId = formFieldId('resume', sectionId, index);
          return (
            <div key={index} className="space-y-2 rounded border p-2">
              <Input
                id={formFieldId(rowId, 'company')}
                name={formFieldId(rowId, 'company')}
                placeholder="Company"
                value={String(item.company ?? '')}
                onChange={(e) => updateItem(index, { company: e.target.value })}
              />
              <Input
                id={formFieldId(rowId, 'role')}
                name={formFieldId(rowId, 'role')}
                placeholder="Role"
                value={String(item.role ?? '')}
                onChange={(e) => updateItem(index, { role: e.target.value })}
              />
              <Input
                id={formFieldId(rowId, 'period')}
                name={formFieldId(rowId, 'period')}
                placeholder="Period (e.g. Jan 2020 – Present)"
                value={String(item.period ?? '')}
                onChange={(e) => updateItem(index, { period: e.target.value })}
              />
              <textarea
                id={formFieldId(rowId, 'description')}
                name={formFieldId(rowId, 'description')}
                className="w-full rounded border p-2 text-sm"
                rows={2}
                placeholder="Description"
                value={String(item.description ?? '')}
                onChange={(e) =>
                  updateItem(index, { description: e.target.value })
                }
              />
              <textarea
                id={formFieldId(rowId, 'bullets')}
                name={formFieldId(rowId, 'bullets')}
                className="w-full rounded border p-2 text-sm"
                rows={3}
                placeholder="Bullets (one per line)"
                value={bulletText}
                onChange={(e) =>
                  updateItem(index, {
                    bullets: e.target.value
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean),
                  })
                }
              />
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
          onClick={() => addItem({ company: '', role: '', bullets: [] })}
        >
          Add experience
        </Button>
      </div>
    );
  }

  const fieldSets: Partial<
    Record<
      ResumeSectionIdValue,
      Array<{ key: string; label: string; multiline?: boolean }>
    >
  > = {
    education: [
      { key: 'institution', label: 'Institution' },
      { key: 'degree', label: 'Degree' },
      { key: 'period', label: 'Period' },
      { key: 'description', label: 'Description', multiline: true },
    ],
    projects: [
      { key: 'name', label: 'Name' },
      { key: 'url', label: 'URL' },
      { key: 'description', label: 'Description', multiline: true },
    ],
    certifications: [
      { key: 'name', label: 'Name' },
      { key: 'issuer', label: 'Issuer' },
      { key: 'date', label: 'Date' },
    ],
    languages: [
      { key: 'name', label: 'Language' },
      { key: 'level', label: 'Level' },
    ],
    links: [
      { key: 'label', label: 'Label' },
      { key: 'url', label: 'URL' },
    ],
  };

  const fields = fieldSets[sectionId];
  if (!fields) return null;

  const emptyItem = Object.fromEntries(fields.map((f) => [f.key, '']));

  return (
    <div className="mt-2 space-y-2 border-t pt-2 text-sm">
      {items.map((item, index) => {
        const rowId = formFieldId('resume', sectionId, index);
        return (
        <div key={index} className="space-y-2 rounded border p-2">
          {fields.map((field) => {
            const fieldId = formFieldId(rowId, field.key);
            return field.multiline ? (
              <textarea
                key={field.key}
                id={fieldId}
                name={fieldId}
                className="w-full rounded border p-2 text-sm"
                rows={2}
                placeholder={field.label}
                value={String(item[field.key] ?? '')}
                onChange={(e) => updateItem(index, { [field.key]: e.target.value })}
              />
            ) : (
              <Input
                key={field.key}
                id={fieldId}
                name={fieldId}
                placeholder={field.label}
                value={String(item[field.key] ?? '')}
                onChange={(e) => updateItem(index, { [field.key]: e.target.value })}
              />
            );
          })}
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
        onClick={() => addItem(emptyItem)}
      >
        Add item
      </Button>
    </div>
  );
}
