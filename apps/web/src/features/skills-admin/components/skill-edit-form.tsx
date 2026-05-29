'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Skill } from '@/features/skills/hooks/use-skills';
import { isApiError } from '@/lib/api-error';
import {
  formValuesToDirtyUpdatePayload,
  skillToFormValues,
  type SkillFormValues,
} from '../lib/skill-form-values';
import { useUpdateSkill } from '../hooks/use-skills-admin-mutations';

type Props = {
  skill: Skill;
  token?: string;
  embedded?: boolean;
  onSaved?: () => void;
};

function fieldId(skillId: string, field: string) {
  return `skill-edit-${skillId}-${field}`;
}

export function SkillEditForm({ skill, token, embedded = false, onSaved }: Props) {
  const initialValuesRef = useRef<SkillFormValues>(skillToFormValues(skill));
  const [values, setValues] = useState<SkillFormValues>(() =>
    skillToFormValues(skill),
  );
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const updateMutation = useUpdateSkill(token);

  const setField = <K extends keyof SkillFormValues>(
    key: K,
    value: SkillFormValues[K],
  ) => {
    setInfo(null);
    setValues((current) => ({ ...current, [key]: value }));
  };

  const saveChanges = async () => {
    setError(null);
    setInfo(null);

    let body;
    try {
      body = formValuesToDirtyUpdatePayload(initialValuesRef.current, values);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Resources JSON is invalid.');
        return;
      }
      throw err;
    }

    if (Object.keys(body).length === 0) {
      setInfo('No changes to save.');
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: skill.id, body });
      initialValuesRef.current = values;
      onSaved?.();
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to save skill');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveChanges();
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={
        embedded ? 'space-y-3' : 'space-y-3 rounded border p-4'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{skill.name}</h3>
        <Link
          href={`/skills/${skill.slug}`}
          className="text-sm text-primary hover:underline"
        >
          View public page
        </Link>
      </div>
      <label className="block text-sm" htmlFor={fieldId(skill.id, 'name')}>
        Name
        <Input
          id={fieldId(skill.id, 'name')}
          className="mt-1"
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          required
        />
      </label>
      <label className="block text-sm" htmlFor={fieldId(skill.id, 'slug')}>
        Slug
        <Input
          id={fieldId(skill.id, 'slug')}
          className="mt-1"
          value={values.slug}
          onChange={(e) => setField('slug', e.target.value)}
          required
        />
      </label>
      <label className="block text-sm" htmlFor={fieldId(skill.id, 'category')}>
        Primary category
        <Input
          id={fieldId(skill.id, 'category')}
          className="mt-1"
          value={values.category}
          onChange={(e) => setField('category', e.target.value)}
          required
        />
      </label>
      <label
        className="block text-sm"
        htmlFor={fieldId(skill.id, 'resource-categories')}
      >
        Resource categories
        <Input
          id={fieldId(skill.id, 'resource-categories')}
          className="mt-1"
          placeholder="Comma-separated"
          value={values.resourceCategories}
          onChange={(e) => setField('resourceCategories', e.target.value)}
        />
      </label>
      <label
        className="block text-sm"
        htmlFor={fieldId(skill.id, 'description')}
      >
        Description
        <textarea
          id={fieldId(skill.id, 'description')}
          className="mt-1 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm" htmlFor={fieldId(skill.id, 'official-url')}>
          Official URL
          <Input
            id={fieldId(skill.id, 'official-url')}
            className="mt-1"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://…"
            value={values.officialUrl}
            onChange={(e) => setField('officialUrl', e.target.value)}
          />
        </label>
        <label className="block text-sm" htmlFor={fieldId(skill.id, 'docs-url')}>
          Docs URL
          <Input
            id={fieldId(skill.id, 'docs-url')}
            className="mt-1"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://…"
            value={values.docsUrl}
            onChange={(e) => setField('docsUrl', e.target.value)}
          />
        </label>
        <label className="block text-sm" htmlFor={fieldId(skill.id, 'github-url')}>
          GitHub URL
          <Input
            id={fieldId(skill.id, 'github-url')}
            className="mt-1"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://…"
            value={values.githubUrl}
            onChange={(e) => setField('githubUrl', e.target.value)}
          />
        </label>
        <label className="block text-sm" htmlFor={fieldId(skill.id, 'roadmap-url')}>
          Roadmap URL
          <Input
            id={fieldId(skill.id, 'roadmap-url')}
            className="mt-1"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://…"
            value={values.roadmapUrl}
            onChange={(e) => setField('roadmapUrl', e.target.value)}
          />
        </label>
      </div>
      <label
        className="block text-sm"
        htmlFor={fieldId(skill.id, 'resources-json')}
      >
        Resources JSON
        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
          Overrides comma-separated resource categories when set
        </span>
        <textarea
          id={fieldId(skill.id, 'resources-json')}
          className="mt-1 min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
          value={values.resourcesJson}
          onChange={(e) => setField('resourcesJson', e.target.value)}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-muted-foreground">{info}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
