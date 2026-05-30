'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseStackfolioBackup } from '@stackfolio/shared';
import { apiFetch } from '@/lib/api-client';
import type { BackupImportResult } from './profile-backup-import-result-modal';

export function useProfileBackupImport(token: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON file.');
      }
      const parsed = parseStackfolioBackup(raw);
      if (!parsed.success) {
        throw new Error(parsed.message);
      }
      if (!token) {
        throw new Error('Session expired. Sign in again.');
      }
      return apiFetch<BackupImportResult>('/profiles/backup/import', {
        method: 'POST',
        token,
        body: JSON.stringify(parsed.data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}
