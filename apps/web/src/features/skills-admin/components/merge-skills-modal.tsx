'use client';

import { useMemo, useState } from 'react';
import {
  buildMergedSkillUpdate,
  type MergeSkillFieldKey,
} from '@stackfolio/shared';
import { Button } from '@/components/ui/button';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import type { Skill } from '@/features/skills/hooks/use-skills';
import { skillToFormValues } from '../lib/skill-form-values';
import {
  fieldHasSecondaryValue,
  getMergeFieldDisplay,
} from '../lib/merge-skill-display';
import { MERGE_FIELD_ROWS } from '../lib/merge-field-labels';
import { useMergeSkills } from '../hooks/use-skills-admin-mutations';

type Props = {
  open: boolean;
  skills: [Skill, Skill];
  token?: string;
  onClose: () => void;
  onMerged: () => void;
};

function snapshotFromSkill(skill: Skill) {
  const values = skillToFormValues(skill);
  const categories = values.resourceCategories
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  let resources: Record<string, unknown> | null = null;
  if (values.resourcesJson.trim()) {
    resources = JSON.parse(values.resourcesJson) as Record<string, unknown>;
  } else if (categories.length > 0) {
    resources = { categories };
  }
  const urls: Record<string, string> = {};
  if (values.officialUrl.trim()) urls.official = values.officialUrl.trim();
  if (values.docsUrl.trim()) urls.docs = values.docsUrl.trim();
  if (values.githubUrl.trim()) urls.github = values.githubUrl.trim();
  if (values.roadmapUrl.trim()) urls.roadmap = values.roadmapUrl.trim();

  return {
    name: skill.name,
    slug: skill.slug,
    category: skill.category,
    description: skill.description ?? null,
    urls: Object.keys(urls).length > 0 ? urls : null,
    resources,
    categories: categories.length ? categories : [skill.category],
  };
}

export function MergeSkillsModal({
  open,
  skills,
  token,
  onClose,
  onMerged,
}: Props) {
  const [left, right] = skills;
  const [preferredId, setPreferredId] = useState<string>(left.id);
  const [adoptFromSecondary, setAdoptFromSecondary] = useState<
    Set<MergeSkillFieldKey>
  >(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const mergeMutation = useMergeSkills(token);

  const preferred = preferredId === left.id ? left : right;
  const secondary = preferredId === left.id ? right : left;

  const preview = useMemo(() => {
    try {
      return buildMergedSkillUpdate(
        snapshotFromSkill(preferred),
        snapshotFromSkill(secondary),
        [...adoptFromSecondary],
      );
    } catch {
      return null;
    }
  }, [preferred, secondary, adoptFromSecondary]);

  const toggleAdopt = (field: MergeSkillFieldKey, checked: boolean) => {
    setAdoptFromSecondary((current) => {
      const next = new Set(current);
      if (checked) next.add(field);
      else next.delete(field);
      return next;
    });
  };

  const handleMerge = async () => {
    setError(null);
    try {
      await mergeMutation.mutateAsync({
        preferredSkillId: preferred.id,
        secondarySkillId: secondary.id,
        adoptFromSecondary: [...adoptFromSecondary],
      });
      onMerged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed');
    }
  };

  if (!open) return null;

  return (
    <ModalOverlay open={open} onBackdropClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg border bg-background p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-skills-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="merge-skills-title" className="text-lg font-semibold">
          Merge skills
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the skill to keep. Check fields to copy or merge from the other
          skill. The non-preferred skill will be deleted after merge.
        </p>

        <div className="mt-4 flex flex-wrap gap-4">
          {[left, right].map((skill) => (
            <label
              key={skill.id}
              className="flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm"
            >
              <input
                type="radio"
                name="preferred-skill"
                checked={preferredId === skill.id}
                onChange={() => {
                  setPreferredId(skill.id);
                  setAdoptFromSecondary(new Set());
                }}
              />
              <span>
                Keep: <strong>{skill.name}</strong> ({skill.slug})
              </span>
            </label>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="p-2">Field</th>
                <th className="p-2">Preferred ({preferred.name})</th>
                <th className="p-2">Other ({secondary.name})</th>
                <th className="p-2">Use other</th>
              </tr>
            </thead>
            <tbody>
              {MERGE_FIELD_ROWS.map(({ key, label }) => {
                const canAdopt = fieldHasSecondaryValue(
                  preferred,
                  secondary,
                  key,
                );
                const preferredDisplay = getMergeFieldDisplay(preferred, key);
                const secondaryDisplay = getMergeFieldDisplay(secondary, key);
                return (
                  <tr key={key} className="border-b last:border-0 align-top">
                    <td className="p-2 font-medium">{label}</td>
                    <td className="max-w-xs p-2 break-words whitespace-pre-wrap text-muted-foreground">
                      {preferredDisplay}
                    </td>
                    <td className="max-w-xs p-2 break-words whitespace-pre-wrap">
                      {secondaryDisplay}
                    </td>
                    <td className="p-2">
                      <input
                        type="checkbox"
                        aria-label={`Use ${label} from ${secondary.name}`}
                        checked={adoptFromSecondary.has(key)}
                        disabled={!canAdopt}
                        onChange={(event) =>
                          toggleAdopt(key, event.target.checked)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {preview && (
          <div className="mt-4 rounded border bg-muted/20 p-3 text-sm">
            <p className="font-medium">Result preview</p>
            <p>
              <span className="text-muted-foreground">Name:</span> {preview.name}
            </p>
            <p>
              <span className="text-muted-foreground">Slug:</span> {preview.slug}
            </p>
            <p>
              <span className="text-muted-foreground">Category:</span>{' '}
              {preview.category}
            </p>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mergeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleMerge()}
            disabled={!token || mergeMutation.isPending}
          >
            {mergeMutation.isPending ? 'Merging…' : 'Merge and delete other'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}
