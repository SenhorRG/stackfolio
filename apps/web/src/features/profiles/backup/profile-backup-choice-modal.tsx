'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModalOverlay } from '@/components/ui/modal-overlay';

type Props = {
  open: boolean;
  onClose: () => void;
  onImportFile: (file: File) => void;
  importPending?: boolean;
};

export function ProfileBackupChoiceModal({
  open,
  onClose,
  onImportFile,
  importPending = false,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const triggerImportPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <ModalOverlay open={open} onBackdropClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-choice-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="backup-choice-title" className="text-lg font-semibold">
          Backup
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Export or import profiles and resumes as JSON.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => {
              onClose();
              router.push('/profiles/backup/export');
            }}
            disabled={importPending}
          >
            Export
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={triggerImportPicker}
            disabled={importPending}
          >
            {importPending ? 'Importing…' : 'Import'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={importPending}>
            Cancel
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImportFile(file);
            e.target.value = '';
          }}
        />
      </div>
    </ModalOverlay>
  );
}
