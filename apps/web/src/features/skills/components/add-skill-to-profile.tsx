'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSkills } from '../hooks/use-skills';
import { CreateCustomSkillForm } from './create-custom-skill-form';
import type { Skill } from '../hooks/use-skills';

export function AddSkillToProfile({
  profileId,
  token,
  existingSkillIds,
}: {
  profileId: string;
  token: string;
  existingSkillIds: string[];
}) {
  const [q, setQ] = useState('');
  const queryClient = useQueryClient();
  const { data } = useSkills({ q: q || undefined, limit: 20, offset: 0 });

  const addMutation = useMutation({
    mutationFn: (skillId: string) =>
      apiFetch(`/profiles/${profileId}/skills`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          skillId,
          level: 'intermediate',
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
      setQ('');
    },
  });

  const addSkillToProfile = (skill: Skill) => {
    if (existingSkillIds.includes(skill.id)) return;
    addMutation.mutate(skill.id);
  };

  const candidates =
    data?.items.filter((t) => !existingSkillIds.includes(t.id)) ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded border p-4">
        <h2 className="font-semibold">Add from catalog</h2>
        <Input
          placeholder="Search skills (seed catalog)..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {candidates.length > 0 && (
          <ul className="space-y-1">
            {candidates.map((skill) => (
              <li key={skill.id} className="flex items-center justify-between gap-2">
                <span className="text-sm">
                  {skill.name}{' '}
                  <span className="text-muted-foreground">({skill.category})</span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={addMutation.isPending}
                  onClick={() => addSkillToProfile(skill)}
                >
                  Add
                </Button>
              </li>
            ))}
          </ul>
        )}
        {q && candidates.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No catalog matches. Create a custom skill below.
          </p>
        )}
      </div>

      <CreateCustomSkillForm
        token={token}
        submitLabel="Create and add to profile"
        onCreated={(skill) => addSkillToProfile(skill)}
      />
    </div>
  );
}
