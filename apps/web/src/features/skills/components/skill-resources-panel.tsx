'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SkillResources } from '../lib/skill-resources';

function LinkList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((url) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-sm text-primary hover:underline"
          >
            {url}
          </a>
        ))}
      </CardContent>
    </Card>
  );
}

function LangGroupedLinks({
  title,
  byLang,
}: {
  title: string;
  byLang: Record<string, string[]>;
}) {
  const entries = Object.entries(byLang).filter(([, v]) => v?.length);
  if (!entries.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map(([lang, items]) => (
          <div key={lang}>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              {lang}
            </p>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item} className="truncate text-sm">
                  {item.startsWith('http') ? (
                    <a
                      href={item}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {item}
                    </a>
                  ) : (
                    item
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

type RelationTarget = { slug: string; name: string };

export function SkillResourcesPanel({
  resources,
  relationsFrom,
}: {
  resources: SkillResources;
  relationsFrom?: Array<{ target: RelationTarget; relationType: string }>;
}) {
  const relationshipNames = resources.relationships ?? [];

  return (
    <div className="space-y-4">
      {(relationsFrom?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {relationsFrom!.map((rel) => (
              <Link
                key={rel.target.slug}
                href={`/skills/${rel.target.slug}`}
                className="rounded border px-2 py-1 text-sm hover:bg-muted"
              >
                {rel.target.name}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {relationshipNames.length > 0 && !relationsFrom?.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Relationships (seed)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {relationshipNames.join(', ')}
            </p>
          </CardContent>
        </Card>
      )}

      <LangGroupedLinks title="Ebooks" byLang={resources.ebooks ?? {}} />
      <LangGroupedLinks title="Articles" byLang={resources.articles ?? {}} />
      <LinkList title="Sites" items={resources.sites ?? []} />
      <LinkList title="Repositories" items={resources.repositories ?? []} />
      <LinkList title="Official docs" items={resources.officialDocs ?? []} />
      <LinkList title="Official links" items={resources.officialLinks ?? []} />
      <LinkList title="Links" items={resources.links ?? []} />
    </div>
  );
}
