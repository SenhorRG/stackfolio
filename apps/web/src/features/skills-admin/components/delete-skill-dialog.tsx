'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Skill } from '@/features/skills/hooks/use-skills';
import { useDeleteSkill } from '../hooks/use-skills-admin-mutations';
import { ConfirmActionModal } from './confirm-action-modal';

type Props = {
  skill: Skill;
  token?: string;
  onDeleted?: () => void;
};

export function DeleteSkillDialog({ skill, token, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteMutation = useDeleteSkill(token);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-red-600"
        onClick={() => setOpen(true)}
      >
        Delete
      </Button>
      <ConfirmActionModal
        open={open}
        title={`Delete ${skill.name}?`}
        description={
          <>
            <p>
              Profile links to this skill are removed automatically (cascade).
            </p>
            {error && <p className="mt-2 text-red-600">{error}</p>}
          </>
        }
        confirmLabel="Delete"
        pending={deleteMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setOpen(false);
            setError(null);
          }
        }}
        onConfirm={async () => {
          setError(null);
          try {
            await deleteMutation.mutateAsync(skill.id);
            setOpen(false);
            onDeleted?.();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : 'Failed to delete skill',
            );
          }
        }}
      />
    </>
  );
}
