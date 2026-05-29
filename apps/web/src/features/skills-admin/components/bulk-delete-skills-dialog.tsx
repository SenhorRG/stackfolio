'use client';

import { useState } from 'react';
import { useBulkDeleteSkills } from '../hooks/use-skills-admin-mutations';
import { ConfirmActionModal } from './confirm-action-modal';

type Props = {
  open: boolean;
  selectedCount: number;
  selectedIds: string[];
  token?: string;
  onClose: () => void;
  onDeleted?: () => void;
};

export function BulkDeleteSkillsDialog({
  open,
  selectedCount,
  selectedIds,
  token,
  onClose,
  onDeleted,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const bulkDelete = useBulkDeleteSkills(token);

  return (
    <>
      <ConfirmActionModal
        open={open}
        title={`Delete ${selectedCount} skill(s)?`}
        description={
          <>
            <p>
              This permanently removes the selected catalog entries. Profile
              links to these skills are removed automatically (cascade).
            </p>
            {error && <p className="mt-2 text-red-600">{error}</p>}
          </>
        }
        confirmLabel="Delete all"
        pending={bulkDelete.isPending}
        onCancel={() => {
          if (!bulkDelete.isPending) {
            setError(null);
            onClose();
          }
        }}
        onConfirm={async () => {
          setError(null);
          try {
            await bulkDelete.mutateAsync(selectedIds);
            onClose();
            onDeleted?.();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : 'Bulk delete failed',
            );
          }
        }}
      />
    </>
  );
}
