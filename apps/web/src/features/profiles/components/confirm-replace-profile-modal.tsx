'use client';

import { Button } from '@/components/ui/button';
import { ModalOverlay } from '@/components/ui/modal-overlay';

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmReplaceProfileModal({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <ModalOverlay open={open}>
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="replace-profile-title"
      >
        <h2 id="replace-profile-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}
