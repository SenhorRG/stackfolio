'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSkills, useSkillCategories } from '@/features/skills/hooks/use-skills';
import { SkillEditModal } from './skill-edit-modal';
import { SkillsAdminToolbar } from './skills-admin-toolbar';
import { SkillsAdminSelectionToolbar } from './skills-admin-selection-toolbar';
import { DeleteSkillDialog } from './delete-skill-dialog';

const PAGE_SIZE = 100;

type Props = {
  token?: string;
};

export function SkillsAdminTable({ token }: Props) {
  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: categories = [] } = useSkillCategories();
  const { data, isLoading, error, refetch } = useSkills({
    q: q || undefined,
    categories: categoryFilter ? [categoryFilter] : undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const items = data?.items ?? [];
  const selectedSkills = useMemo(
    () => items.filter((skill) => selectedIds.has(skill.id)),
    [items, selectedIds],
  );
  const editingSkill = useMemo(
    () => items.find((skill) => skill.id === editingId) ?? null,
    [items, editingId],
  );

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    setSelectedIds((current) => {
      const allSelected = items.every((skill) => current.has(skill.id));
      if (allSelected) {
        const next = new Set(current);
        for (const skill of items) next.delete(skill.id);
        return next;
      }
      const next = new Set(current);
      for (const skill of items) next.add(skill.id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleRowDeleted = (deletedId: string) => {
    setSelectedIds((current) => {
      if (!current.has(deletedId)) return current;
      const next = new Set(current);
      next.delete(deletedId);
      return next;
    });
    if (editingId === deletedId) setEditingId(null);
    void refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search skills…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOffset(0);
          }}
          className="max-w-sm"
        />
        <SkillsAdminToolbar
          categories={categories}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={(value) => {
            setCategoryFilter(value);
            setOffset(0);
          }}
        />
      </div>

      <SkillsAdminSelectionToolbar
        selectedIds={[...selectedIds]}
        selectedSkills={selectedSkills}
        token={token}
        onUpdated={() => {
          clearSelection();
          void refetch();
        }}
      />

      {isLoading && <p>Loading skills…</p>}
      {error && <p className="text-red-600">{(error as Error).message}</p>}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="p-2">
                  <input
                    type="checkbox"
                    aria-label="Select all on page"
                    checked={
                      items.length > 0 &&
                      items.every((skill) => selectedIds.has(skill.id))
                    }
                    onChange={toggleAllOnPage}
                  />
                </th>
                <th className="p-2">Name</th>
                <th className="p-2">Slug</th>
                <th className="p-2">Category</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((skill) => (
                <tr key={skill.id} className="border-b last:border-0">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(skill.id)}
                      onChange={() => toggleSelected(skill.id)}
                      aria-label={`Select ${skill.name}`}
                    />
                  </td>
                  <td className="p-2 font-medium">{skill.name}</td>
                  <td className="p-2 text-muted-foreground">{skill.slug}</td>
                  <td className="p-2">{skill.category}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(skill.id)}
                      >
                        Edit
                      </Button>
                      <DeleteSkillDialog
                        skill={skill}
                        token={token}
                        onDeleted={() => handleRowDeleted(skill.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && items.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">No skills match your filters.</p>
      )}

      {data && items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
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
            {offset + 1}–{offset + items.length} of {data.total}
          </p>
          {offset + items.length < data.total && (
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

      <SkillEditModal
        skill={editingSkill}
        token={token}
        onClose={() => setEditingId(null)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
