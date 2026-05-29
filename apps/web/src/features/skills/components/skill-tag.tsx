'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { useApiToken } from '@/features/auth/hooks/use-api-token';
import { Button } from '@/components/ui/button';
import type { Skill } from '../hooks/use-skills';

type Profile = { id: string; name: string; isMain: boolean };

export function SkillTag({ skill }: { skill: Skill }) {
  const [open, setOpen] = useState(false);
  const { token, isAuthenticated } = useApiToken();
  const queryClient = useQueryClient();

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => apiFetch<Profile[]>('/profiles', { token: token! }),
    enabled: isAuthenticated && open && Boolean(token),
  });

  const addMutation = useMutation({
    mutationFn: (profileId: string) =>
      apiFetch(`/profiles/${profileId}/skills`, {
        method: 'POST',
        token: token!,
        body: JSON.stringify({
          skillId: skill.id,
          level: 'intermediate',
          years: 1,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setOpen(false);
    },
  });

  return (
    <span className="group relative inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-sm">
      <Link href={`/skills/${skill.slug}`} className="hover:text-primary">
        {skill.name}
      </Link>
      {isAuthenticated && (
        <button
          type="button"
          className="rounded-full p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label={`Add ${skill.name}`}
        >
          <Plus size={14} />
        </button>
      )}
      {open && profiles && (
        <div className="absolute left-0 top-full z-10 mt-1 min-w-[180px] rounded-md border border-border bg-card p-2 shadow-lg">
          <p className="mb-1 text-xs text-muted-foreground">Add to profile</p>
          {profiles.map((p) => (
            <Button
              key={p.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => addMutation.mutate(p.id)}
            >
              {p.name} {p.isMain ? '(main)' : ''}
            </Button>
          ))}
        </div>
      )}
    </span>
  );
}
