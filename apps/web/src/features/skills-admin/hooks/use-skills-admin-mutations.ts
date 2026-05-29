'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  BulkUpdateSkillCategoryInput,
  MergeSkillsInput,
  UpdateSkillAdminInput,
} from '@stackfolio/shared';
import { apiFetch } from '@/lib/api-client';
import type { Skill } from '@/features/skills/hooks/use-skills';

type DeleteSkillResult = {
  deleted: boolean;
  id: string;
  profileSkillsRemoved: number;
};

export function useUpdateSkill(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateSkillAdminInput;
    }) =>
      apiFetch<Skill>(`/skills/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skill'] });
      queryClient.invalidateQueries({ queryKey: ['skill-categories'] });
    },
  });
}

export function useBulkUpdateSkillCategory(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkUpdateSkillCategoryInput) =>
      apiFetch<{ updated: number; category: string }>(
        '/skills/bulk/category',
        {
          method: 'PATCH',
          token,
          body: JSON.stringify(body),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skill-categories'] });
    },
  });
}

export function useDeleteSkill(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<DeleteSkillResult>(`/skills/${id}`, {
        method: 'DELETE',
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skill-categories'] });
    },
  });
}

type MergeSkillsResult = {
  merged: Skill;
  deletedSkillId: string;
  profileSkills: { reassigned: number; dropped: number };
};

export function useMergeSkills(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: MergeSkillsInput) =>
      apiFetch<MergeSkillsResult>('/skills/merge', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skill'] });
      queryClient.invalidateQueries({ queryKey: ['skill-categories'] });
    },
  });
}

export function useBulkDeleteSkills(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map((id) =>
          apiFetch<DeleteSkillResult>(`/skills/${id}`, {
            method: 'DELETE',
            token,
          }),
        ),
      );
      return { deleted: results.length, results };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skill-categories'] });
    },
  });
}
