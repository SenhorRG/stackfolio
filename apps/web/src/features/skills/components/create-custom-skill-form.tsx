'use client';

import { useState } from 'react';
import { CUSTOM_SKILL_CATEGORY } from '@stackfolio/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateSkill } from '../hooks/use-create-skill';
import type { Skill } from '../hooks/use-skills';

type Props = {
  token?: string;
  onCreated?: (skill: Skill) => void;
  submitLabel?: string;
};

export function CreateCustomSkillForm({
  token,
  onCreated,
  submitLabel = 'Create skill',
}: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CUSTOM_SKILL_CATEGORY);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateSkill(token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Skill name is required.');
      return;
    }
    try {
      const skill = await createMutation.mutateAsync({
        name: trimmed,
        category: category.trim() || CUSTOM_SKILL_CATEGORY,
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
      onCreated?.(skill);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create skill');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-dashed p-4">
      <h2 className="font-semibold">Create custom skill</h2>
      <p className="text-sm text-muted-foreground">
        Add a skill that is not in the catalog. Slug is generated from the name.
      </p>
      <Input
        placeholder="Skill name (required)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <Input
        placeholder="Short description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="sm" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating…' : submitLabel}
      </Button>
    </form>
  );
}
