'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUpload } from '@/lib/api-upload';
import { Button } from '@/components/ui/button';
import { ConfirmReplaceProfileModal } from './confirm-replace-profile-modal';
import { clientProfileHasFilledData } from '../utils/profile-has-filled-data-client';

type ProfileResponse = {
  id: string;
  profileData: unknown;
  skills: Array<{ skillId: string }>;
};

type ImportResult = {
  profile: ProfileResponse;
  warnings: string[];
};

type Props = {
  profileId: string;
  token: string;
  profileData: unknown;
  skillsCount: number;
  onImported?: () => void;
  compact?: boolean;
};

export function ProfilePdfImportSection({
  profileId,
  token,
  profileData,
  skillsCount,
  onImported,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiUpload<ImportResult>(
        `/profiles/${profileId}/import-from-pdf`,
        form,
        token,
      );
    },
    onSuccess: (result) => {
      setWarnings(result.warnings ?? []);
      setMessage('Profile updated from PDF.');
      setPendingFile(null);
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
      onImported?.();
    },
    onError: (err: Error) => {
      setMessage(err.message);
      setConfirmOpen(false);
    },
  });

  const hasData = clientProfileHasFilledData({ profileData, skillsCount });

  const runImport = (file: File) => {
    setMessage(null);
    setWarnings([]);
    importMutation.mutate(file);
  };

  const onFileChosen = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setMessage('Please choose a PDF file.');
      return;
    }
    if (hasData) {
      setPendingFile(file);
      setConfirmOpen(true);
      return;
    }
    runImport(file);
  };

  const content = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          onFileChosen(file);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={importMutation.isPending}
        onClick={() => inputRef.current?.click()}
      >
        Import from PDF (beta)
      </Button>
      {warnings.length > 0 && (
        <ul
          className={
            compact
              ? 'w-full basis-full list-disc pl-5 text-sm text-amber-700'
              : 'list-disc pl-5 text-sm text-amber-700'
          }
        >
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      {message && (
        <p
          className={
            compact
              ? 'w-full basis-full text-sm text-muted-foreground'
              : 'text-sm text-muted-foreground'
          }
          role="status"
        >
          {message}
        </p>
      )}
      <ConfirmReplaceProfileModal
        open={confirmOpen}
        title="Replace profile data?"
        description="This profile already has data. Importing from PDF will replace identity fields and link catalog skills that match the PDF (unmatched skills are not added to the database)."
        confirmLabel="Replace and import"
        pending={importMutation.isPending}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingFile(null);
        }}
        onConfirm={() => {
          if (pendingFile) runImport(pendingFile);
        }}
      />
    </>
  );

  if (compact) {
    return content;
  }

  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">
        Upload a resume PDF to replace identity fields and link skills that already
        exist in the catalog. Skills not in the catalog are skipped.
      </p>
      {content}
    </section>
  );
}
