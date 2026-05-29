'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateCustomSkillInput } from '@stackfolio/shared';
import { apiFetch } from '@/lib/api-client';
import type { Skill } from './use-skills';

export function useCreateSkill(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCustomSkillInput) =>
      apiFetch<Skill>('/skills', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skill-categories'] });
    },
  });
}
