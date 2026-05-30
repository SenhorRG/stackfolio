'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModalOverlay } from '@/components/ui/modal-overlay';

export type BackupImportResult = {
  profilesCreated: number;
  resumeProjectsCreated: number;
  warnings: string[];
};

type Props = {
  open: boolean;
  pending?: boolean;
  result: BackupImportResult | null;
  error: string | null;
  onClose: () => void;
};

export function ProfileBackupImportResultModal({
  open,
  pending = false,
  result,
  error,
  onClose,
}: Props) {
  if (!open) return null;

  const title = pending
    ? 'Importing backup'
    : error
      ? 'Import failed'
      : 'Import complete';

  return (
    <ModalOverlay
      open={open}
      onBackdropClick={pending ? undefined : onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-busy={pending}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {pending ? (
          <div
            className="mt-4 flex items-center gap-3 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
            <p>Creating profiles and resumes from your backup file…</p>
          </div>
        ) : error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : result ? (
          <div className="mt-2 space-y-2 text-sm">
            <p>
              Profiles created: <strong>{result.profilesCreated}</strong>
            </p>
            <p>
              Resumes created: <strong>{result.resumeProjectsCreated}</strong>
            </p>
            {result.warnings.length > 0 ? (
              <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Warnings
                </p>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {result.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        {!pending ? (
          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : null}
      </div>
    </ModalOverlay>
  );
}
