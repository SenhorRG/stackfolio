'use client';

import { Button } from '@/components/ui/button';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import type { Skill } from '@/features/skills/hooks/use-skills';
import { SkillEditForm } from './skill-edit-form';

type Props = {
  skill: Skill | null;
  token?: string;
  onClose: () => void;
  onSaved?: () => void;
};

export function SkillEditModal({ skill, token, onClose, onSaved }: Props) {
  if (!skill) return null;

  return (
    <ModalOverlay
      open
      className="items-center overflow-hidden p-4 sm:p-6"
      onBackdropClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border bg-background shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-edit-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b px-6 py-4">
          <h2 id="skill-edit-modal-title" className="text-lg font-semibold">
            Edit skill
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <SkillEditForm
            key={skill.id}
            skill={skill}
            token={token}
            embedded
            onSaved={() => {
              onSaved?.();
              onClose();
            }}
          />
        </div>
      </div>
    </ModalOverlay>
  );
}
