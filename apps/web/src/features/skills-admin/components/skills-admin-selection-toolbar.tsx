'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Skill } from '@/features/skills/hooks/use-skills';
import { useBulkUpdateSkillCategory } from '../hooks/use-skills-admin-mutations';
import { BulkDeleteSkillsDialog } from './bulk-delete-skills-dialog';
import { MergeSkillsModal } from './merge-skills-modal';

type Props = {
  selectedIds: string[];
  selectedSkills: Skill[];
  token?: string;
  onUpdated?: () => void;
};

export function SkillsAdminSelectionToolbar({
  selectedIds,
  selectedSkills,
  token,
  onUpdated,
}: Props) {
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const bulkMutation = useBulkUpdateSkillCategory(token);
  const canMerge = selectedSkills.length === 2;
  const mergePair = canMerge
    ? ([selectedSkills[0], selectedSkills[1]] as [Skill, Skill])
    : null;

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded border bg-muted/30 p-3">
        <p className="text-sm font-medium">
          {selectedIds.length} skill(s) selected
        </p>
        <Input
          placeholder="New category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="max-w-xs"
        />
        <Button
          type="button"
          size="sm"
          disabled={!token || !category.trim() || bulkMutation.isPending}
          onClick={async () => {
            setError(null);
            try {
              await bulkMutation.mutateAsync({
                skillIds: selectedIds,
                category: category.trim(),
              });
              setCategory('');
              onUpdated?.();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : 'Bulk update failed',
              );
            }
          }}
        >
          {bulkMutation.isPending ? 'Updating…' : 'Apply category'}
        </Button>
        {canMerge && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!token}
            onClick={() => setMergeOpen(true)}
          >
            Merge selected
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-red-600"
          disabled={!token}
          onClick={() => setBulkDeleteOpen(true)}
        >
          Delete selected
        </Button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </div>
      <BulkDeleteSkillsDialog
        open={bulkDeleteOpen}
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        token={token}
        onClose={() => setBulkDeleteOpen(false)}
        onDeleted={onUpdated}
      />
      {mergePair && (
        <MergeSkillsModal
          open={mergeOpen}
          skills={mergePair}
          token={token}
          onClose={() => setMergeOpen(false)}
          onMerged={() => onUpdated?.()}
        />
      )}
    </>
  );
}
