'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

type SkillEntry = {
  skillId: string;
  level: string;
  years: number | null;
  highlight: boolean;
  skill: { name: string; slug: string };
};

type ProfileSkillsListProps = {
  profileId: string;
  skills: SkillEntry[];
};

export function ProfileSkillsList({
  profileId,
  skills,
}: ProfileSkillsListProps) {
  if (!skills.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No skills on this profile yet.{' '}
        <Link
          href={`/profiles/${profileId}/skills`}
          className="text-primary hover:underline"
        >
          Add skills
        </Link>
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Skills</h2>
        <Link href={`/profiles/${profileId}/skills`}>
          <Button variant="outline" size="sm">
            Edit skills
          </Button>
        </Link>
      </div>
      <ul className="flex flex-wrap gap-2">
        {skills.map((entry) => (
          <li
            key={entry.skillId}
            className="rounded-full border border-border px-3 py-1 text-sm"
          >
            <Link
              href={`/skills/${entry.skill.slug}`}
              className="font-medium text-primary hover:underline"
            >
              {entry.skill.name}
            </Link>
            <span className="ml-2 text-muted-foreground">
              {entry.level}
              {entry.years != null ? ` · ${entry.years}y` : ''}
              {entry.highlight ? ' · highlight' : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
