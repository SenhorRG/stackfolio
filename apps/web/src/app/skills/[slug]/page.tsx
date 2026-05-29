'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSkill } from '@/features/skills/hooks/use-skills';
import { SkillResourcesPanel } from '@/features/skills/components/skill-resources-panel';
import { SkillCategoryTags } from '@/features/skills/components/skill-category-tags';
import { parseSkillResources } from '@/features/skills/lib/skill-resources';

export default function SkillDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useSkill(slug);

  if (isLoading) return <p>Loading...</p>;
  if (error || !data) return <p>Skill not found</p>;

  const urls = (data.urls as Record<string, string>) ?? {};
  const resources = parseSkillResources(data.resources);
  const categoryTags =
    data.categories?.length ? data.categories : (resources.categories ?? []);

  return (
    <div className="space-y-6">
      <Link href="/skills" className="text-sm text-primary">
        ← Back
      </Link>
      <h1 className="text-3xl font-bold">{data.name}</h1>
      {data.description && <p className="max-w-3xl">{data.description}</p>}
      <SkillCategoryTags categories={categoryTags} />

      {Object.keys(urls).length > 0 && (
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Quick links</h2>
          {Object.entries(urls).map(([key, url]) => (
            <a
              key={key}
              href={url}
              className="block text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {key}: {url}
            </a>
          ))}
        </div>
      )}

      <SkillResourcesPanel
        resources={resources}
        relationsFrom={data.relationsFrom}
      />
    </div>
  );
}
