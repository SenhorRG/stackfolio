'use client';

import { descriptionToBullets } from '../utils/description-to-bullets';
import type { ProfileIdentity } from '@stackfolio/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileCollapsibleSection } from './profile-collapsible-section';
import { formFieldId } from '@/lib/form-field-id';

type ExperienceItem = ProfileIdentity['experience'][number];

type Props = {
  items: ExperienceItem[];
  readOnly?: boolean;
  onChange: (items: ExperienceItem[]) => void;
};

export function ProfileExperienceField({ items, readOnly, onChange }: Props) {
  const updateItem = (index: number, patch: Partial<ExperienceItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const lines = value.split('\n');
    const normalized = lines
      .map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (i > 0 && lines[i - 1]?.trim() === '' && !/^[\s•\-*]/.test(trimmed)) {
          return `• ${trimmed}`;
        }
        return trimmed;
      })
      .join('\n');
    updateItem(index, { description: normalized });
  };

  const addButton = !readOnly ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => onChange([...items, { company: '' }])}
    >
      Add
    </Button>
  ) : undefined;

  return (
    <ProfileCollapsibleSection
      title="Experience"
      readOnly={readOnly}
      count={items.length}
      action={addButton}
    >
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">None added yet.</p>
      )}
      {items.map((item, index) => (
        <div
          key={index}
          className="space-y-2 rounded border border-border p-3"
        >
          {readOnly ? (
            <div className="space-y-1 text-sm">
              {item.company && (
                <p className="font-medium text-foreground">{item.company}</p>
              )}
              {item.role && <p>{item.role}</p>}
              {item.period && (
                <p className="text-muted-foreground">{item.period}</p>
              )}
              {descriptionToBullets(item.description).length > 0 && (
                <ul className="list-disc space-y-1 pl-5">
                  {descriptionToBullets(item.description).map((bullet, bi) => (
                    <li key={bi}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              <Input
                id={formFieldId('profile', 'experience', index, 'company')}
                name={formFieldId('profile', 'experience', index, 'company')}
                placeholder="Company"
                value={item.company ?? ''}
                onChange={(e) => updateItem(index, { company: e.target.value })}
              />
              <Input
                id={formFieldId('profile', 'experience', index, 'role')}
                name={formFieldId('profile', 'experience', index, 'role')}
                placeholder="Role"
                value={item.role ?? ''}
                onChange={(e) => updateItem(index, { role: e.target.value })}
              />
              <Input
                id={formFieldId('profile', 'experience', index, 'period')}
                name={formFieldId('profile', 'experience', index, 'period')}
                placeholder="Period"
                value={item.period ?? ''}
                onChange={(e) => updateItem(index, { period: e.target.value })}
              />
              <textarea
                id={formFieldId('profile', 'experience', index, 'description')}
                name={formFieldId('profile', 'experience', index, 'description')}
                className="w-full rounded border px-2 py-1 text-sm"
                rows={4}
                placeholder="One bullet per line. Start a new paragraph for another bullet."
                value={item.description ?? ''}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
              />
            </>
          )}
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remove
            </Button>
          )}
        </div>
      ))}
    </ProfileCollapsibleSection>
  );
}
