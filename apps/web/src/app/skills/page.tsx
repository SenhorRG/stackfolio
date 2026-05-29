'use client';

import { useMemo, useState } from 'react';
import { SkillTag } from '@/features/skills/components/skill-tag';
import { SkillCategoryFilter } from '@/features/skills/components/skill-category-filter';
import { CreateCustomSkillForm } from '@/features/skills/components/create-custom-skill-form';
import { useSkills, useSkillCategories } from '@/features/skills/hooks/use-skills';
import { useApiToken } from '@/features/auth/hooks/use-api-token';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 60;

export default function SkillsPage() {
  const { token, isAuthenticated } = useApiToken();
  const [q, setQ] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [offset, setOffset] = useState(0);
  const { data: categories } = useSkillCategories();

  const categoryFilter = useMemo(
    () => (selectedCategories.size > 0 ? [...selectedCategories] : undefined),
    [selectedCategories],
  );

  const { data, isLoading, error } = useSkills({
    q: q || undefined,
    categories: categoryFilter,
    limit: PAGE_SIZE,
    offset,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Skills</h1>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, slug, category or description..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOffset(0);
          }}
          className="max-w-sm"
        />
        {categories && categories.length > 0 && (
          <SkillCategoryFilter
            categories={categories}
            selected={selectedCategories}
            onChange={(next) => {
              setSelectedCategories(next);
              setOffset(0);
            }}
          />
        )}
      </div>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{(error as Error).message}</p>}
      <div className="flex flex-wrap gap-2">
        {data?.items.map((skill) => (
          <SkillTag key={skill.id} skill={skill} />
        ))}
      </div>
      {data && (
        <div className="flex flex-wrap items-center gap-3 justify-center">
          {offset > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              Previous
            </Button>
          )}
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{offset + data.items.length} of {data.total}
          </p>
          {offset + data.items.length < data.total && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Next
            </Button>
          )}
        </div>
      )}
      {isAuthenticated && token && (
        <CreateCustomSkillForm token={token} />
      )}
    </div>
  );
}
