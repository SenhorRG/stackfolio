'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

import type { SkillResources } from '../lib/skill-resources';

export type Skill = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  urls?: Record<string, string> | null;
  resources?: SkillResources;
  categories?: string[];
};

export type SkillDetail = Skill & {
  relationsFrom?: Array<{
    relationType: string;
    target: { id: string; name: string; slug: string; category: string };
  }>;
};

export function useSkills(params?: {
  q?: string;
  categories?: string[];
  limit?: number;
  offset?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.categories?.length) {
    search.set('category', params.categories[0]);
  }
  search.set('limit', String(params?.limit ?? 60));
  search.set('offset', String(params?.offset ?? 0));
  const qs = `?${search}`;
  return useQuery({
    queryKey: ['skills', params],
    queryFn: () => apiFetch<{ items: Skill[]; total: number }>(`/skills${qs}`),
  });
}

export function useSkillCategories() {
  return useQuery({
    queryKey: ['skill-categories'],
    queryFn: () => apiFetch<string[]>('/skills/categories'),
  });
}

export function useSkill(slug: string) {
  return useQuery({
    queryKey: ['skill', slug],
    queryFn: () => apiFetch<SkillDetail>(`/skills/${slug}`),
    enabled: Boolean(slug),
  });
}
