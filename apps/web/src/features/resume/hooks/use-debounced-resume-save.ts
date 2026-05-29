'use client';

import { useCallback, useRef } from 'react';
import type { ResumeProject } from './use-resume-project';
import { useUpdateResumeProject } from './use-resume-project';
import { pickResumePatch } from '../utils/resume-patch';

export function useDebouncedResumeSave(
  projectId: string,
  token?: string,
  delayMs = 500,
) {
  const update = useUpdateResumeProject(projectId, token);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (patch: Partial<ResumeProject>, onSaved?: (data: ResumeProject) => void) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const body = pickResumePatch(patch);
      if (Object.keys(body).length === 0) return;
      timerRef.current = setTimeout(() => {
        update.mutate(body, {
          onSuccess: (data) => onSaved?.(data),
        });
      }, delayMs);
    },
    [update, delayMs],
  );

  const flush = useCallback(
    (patch: Partial<ResumeProject> | ResumeProject,
     onSaved?: (data: ResumeProject) => void) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const body = pickResumePatch(patch);
      if (Object.keys(body).length === 0) return;
      update.mutate(body, { onSuccess: (data) => onSaved?.(data) });
    },
    [update],
  );

  return { save, flush, isPending: update.isPending };
}
