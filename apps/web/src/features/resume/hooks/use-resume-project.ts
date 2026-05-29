'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

import type { JsonLayoutShape } from '@stackfolio/shared';
import type { ResumeProjectPatch } from '../utils/resume-patch';
import { normalizeResumeProject } from '../utils/normalize-resume-project';

export type ResumeProject = {
  id: string;
  profileId: string;
  name: string;
  theme: string;
  font: string;
  spacing: string;
  sectionOrder: string[];
  visibility: Record<string, boolean>;
  dividerStyle: string;
  pageCount: number;
  jsonLayout: JsonLayoutShape;
  updatedAt?: string;
};

export function useResumeProject(id: string, token?: string) {
  return useQuery({
    queryKey: ['resume-project', id],
    queryFn: async () =>
      normalizeResumeProject(
        await apiFetch(`/resume-projects/${id}`, { token: token! }),
      ),
    enabled: Boolean(token && id),
  });
}

export function useUpdateResumeProject(id: string, token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ResumeProjectPatch) =>
      normalizeResumeProject(
        await apiFetch(`/resume-projects/${id}`, {
          method: 'PATCH',
          token: token!,
          body: JSON.stringify(body),
        }),
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(['resume-project', id], data);
    },
  });
}
