'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSkills } from '@/features/skills/hooks/use-skills';
import { formFieldId } from '@/lib/form-field-id';

type Props = {
  existingNames: string[];
  onAdd: (skill: {
    name: string;
    skillSlug: string;
    level?: string;
    category?: string;
    categories?: string[];
  }) => void;
};

export function ResumeSkillSearch({ existingNames, onAdd }: Props) {
  const [q, setQ] = useState('');
  const { data, isLoading } = useSkills({ q: q || undefined, limit: 20, offset: 0 });

  const normalizedExisting = new Set(
    existingNames.map((n) => n.trim().toLowerCase()).filter(Boolean),
  );

  const candidates =
    data?.items.filter(
      (skill) => !normalizedExisting.has(skill.name.trim().toLowerCase()),
    ) ?? [];

  return (
    <div className="space-y-2 rounded border border-dashed p-2">
      <p className="text-xs font-medium text-muted-foreground">Search catalog</p>
      <Input
        id={formFieldId('resume-skill-search')}
        name={formFieldId('resume-skill-search')}
        placeholder="Search skills..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {isLoading && q && (
        <p className="text-xs text-muted-foreground">Searching...</p>
      )}
      {candidates.length > 0 && (
        <ul className="max-h-40 space-y-1 overflow-y-auto">
          {candidates.map((skill) => (
            <li
              key={skill.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span>
                {skill.name}{' '}
                <span className="text-muted-foreground">({skill.category})</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  onAdd({
                    name: skill.name,
                    skillSlug: skill.slug,
                    level: 'intermediate',
                    category: skill.category,
                    categories: skill.categories,
                  });
                  setQ('');
                }}
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}
      {q && !isLoading && candidates.length === 0 && (
        <p className="text-xs text-muted-foreground">No matching skills.</p>
      )}
    </div>
  );
}
