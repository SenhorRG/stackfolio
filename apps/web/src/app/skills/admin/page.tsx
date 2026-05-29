'use client';

import Link from 'next/link';
import { useApiToken } from '@/features/auth/hooks/use-api-token';
import { ExportSkillsButton } from '@/features/skills-admin/components/export-skills-button';
import { SkillsAdminGate } from '@/features/skills-admin/components/skills-admin-gate';
import { SkillsAdminTable } from '@/features/skills-admin/components/skills-admin-table';

export default function SkillsAdminPage() {
  const { token } = useApiToken();

  return (
    <SkillsAdminGate>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/skills" className="text-sm text-primary">
              ← Skills catalog
            </Link>
            <h1 className="mt-2 text-2xl font-bold">Skills admin</h1>
            <p className="text-sm text-muted-foreground">
              Edit catalog skills, bulk-update categories, delete entries, or
              export the full database catalog as JSON.
            </p>
          </div>
          <ExportSkillsButton token={token} />
        </div>
        <SkillsAdminTable token={token} />
      </div>
    </SkillsAdminGate>
  );
}
