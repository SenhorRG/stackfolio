'use client';

import { Button } from '@/components/ui/button';
import { ModalOverlay } from '@/components/ui/modal-overlay';

type Props = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  pending?: boolean;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmActionModal({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  destructive = true,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <ModalOverlay open={open} onBackdropClick={onCancel}>
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-action-title" className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-2 text-sm text-muted-foreground">{description}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}
