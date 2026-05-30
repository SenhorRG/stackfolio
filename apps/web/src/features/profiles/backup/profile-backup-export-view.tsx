'use client';

import Link from 'next/link';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { BackupExportMode, StackfolioBackup } from '@stackfolio/shared';
import { apiFetch } from '@/lib/api-client';
import {
  useApiToken,
  useAuthenticatedQueryEnabled,
} from '@/features/auth/hooks/use-api-token';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { BackupSelectionList } from './backup-selection-list';
import { downloadBackupJson } from './download-backup-json';

type ProfileRow = {
  id: string;
  name: string;
  isMain: boolean;
  _count?: { resumeProjects: number };
};

type ResumeRow = {
  id: string;
  name: string;
  updatedAt: string;
};

const MODE_OPTIONS: Array<{
  mode: BackupExportMode;
  title: string;
  description: string;
}> = [
  {
    mode: 'profiles_and_resumes',
    title: 'Export profiles and resumes',
    description: 'Selected profiles with all resumes for each.',
  },
  {
    mode: 'profiles_only',
    title: 'Export profiles only',
    description: 'Profile data and skills, without resumes.',
  },
  {
    mode: 'profile_resumes',
    title: 'Export resumes from one profile',
    description: 'Pick a profile and select specific resumes.',
  },
];

export function ProfileBackupExportView() {
  const { token } = useApiToken();
  const queryEnabled = useAuthenticatedQueryEnabled();
  const [mode, setMode] = useState<BackupExportMode | null>(null);
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(
    new Set(),
  );
  const [resumeProfileId, setResumeProfileId] = useState<string | null>(null);
  const [selectedResumeIds, setSelectedResumeIds] = useState<Set<string>>(
    new Set(),
  );

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => apiFetch<ProfileRow[]>('/profiles', { token: token! }),
    enabled: queryEnabled,
  });

  const resumeQueries = useQueries({
    queries: profiles.map((p) => ({
      queryKey: ['resume-projects', p.id, 'backup-export'],
      queryFn: () =>
        apiFetch<ResumeRow[]>(`/resume-projects/profile/${p.id}`, {
          token: token!,
        }),
      enabled: queryEnabled && mode === 'profile_resumes',
    })),
  });

  const resumesByProfileId = useMemo(() => {
    const map = new Map<string, ResumeRow[]>();
    profiles.forEach((p, index) => {
      map.set(p.id, resumeQueries[index]?.data ?? []);
    });
    return map;
  }, [profiles, resumeQueries]);

  const exportMutation = useMutation({
    mutationFn: (body: {
      mode: BackupExportMode;
      profileIds?: string[];
      resumeProjectIds?: string[];
    }) =>
      apiFetch<StackfolioBackup>('/profiles/backup/export', {
        method: 'POST',
        token: token!,
        body: JSON.stringify(body),
      }),
    onSuccess: (backup) => {
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBackupJson(backup, `stackfolio-backup-${stamp}.json`);
    },
  });

  const profileItems = profiles.map((p) => ({
    id: p.id,
    label: p.name,
    hint: p.isMain
      ? 'Main profile'
      : `${p._count?.resumeProjects ?? 0} resume(s)`,
  }));

  const resumeItems =
    resumeProfileId != null
      ? (resumesByProfileId.get(resumeProfileId) ?? []).map((r) => ({
          id: r.id,
          label: r.name,
          hint: new Date(r.updatedAt).toLocaleString(),
        }))
      : [];

  const toggleInSet = (
    set: Set<string>,
    updater: (next: Set<string>) => void,
    id: string,
  ) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updater(next);
  };

  const canExport =
    mode === 'profiles_and_resumes' || mode === 'profiles_only'
      ? selectedProfileIds.size > 0
      : mode === 'profile_resumes'
        ? resumeProfileId != null && selectedResumeIds.size > 0
        : false;

  const handleExport = () => {
    if (!mode) return;
    if (mode === 'profile_resumes') {
      exportMutation.mutate({
        mode,
        resumeProjectIds: [...selectedResumeIds],
      });
      return;
    }
    exportMutation.mutate({
      mode,
      profileIds: [...selectedProfileIds],
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Export backup"
        actions={
          <Link href="/profiles">
            <Button variant="outline">Back</Button>
          </Link>
        }
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {MODE_OPTIONS.map((opt) => (
              <label
                key={opt.mode}
                className="flex cursor-pointer gap-3 rounded-md border p-3 has-[:checked]:border-primary"
              >
                <input
                  type="radio"
                  name="backup-export-mode"
                  className="mt-1"
                  checked={mode === opt.mode}
                  onChange={() => {
                    setMode(opt.mode);
                    setSelectedProfileIds(new Set());
                    setResumeProfileId(null);
                    setSelectedResumeIds(new Set());
                  }}
                />
                <span>
                  <span className="font-medium">{opt.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {opt.description}
                  </span>
                </span>
              </label>
            ))}
          </CardContent>
        </Card>

        {mode && (mode === 'profiles_and_resumes' || mode === 'profiles_only') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select profiles</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <BackupSelectionList
                  items={profileItems}
                  selectedIds={selectedProfileIds}
                  disabled={exportMutation.isPending}
                  onToggle={(id) =>
                    toggleInSet(selectedProfileIds, setSelectedProfileIds, id)
                  }
                  onSelectAll={() =>
                    setSelectedProfileIds(new Set(profiles.map((p) => p.id)))
                  }
                  onClearAll={() => setSelectedProfileIds(new Set())}
                />
              )}
            </CardContent>
          </Card>
        )}

        {mode === 'profile_resumes' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile and resumes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Profile</p>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={resumeProfileId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    setResumeProfileId(id);
                    setSelectedResumeIds(new Set());
                  }}
                >
                  <option value="">Select a profile…</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              {resumeProfileId ? (
                <BackupSelectionList
                  items={resumeItems}
                  selectedIds={selectedResumeIds}
                  disabled={exportMutation.isPending}
                  onToggle={(id) =>
                    toggleInSet(selectedResumeIds, setSelectedResumeIds, id)
                  }
                  onSelectAll={() =>
                    setSelectedResumeIds(
                      new Set(
                        (resumesByProfileId.get(resumeProfileId) ?? []).map(
                          (r) => r.id,
                        ),
                      ),
                    )
                  }
                  onClearAll={() => setSelectedResumeIds(new Set())}
                />
              ) : null}
            </CardContent>
          </Card>
        )}

        {mode ? (
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!canExport || exportMutation.isPending}
              onClick={handleExport}
            >
              {exportMutation.isPending
                ? 'Exporting…'
                : 'Confirm and download JSON'}
            </Button>
            {exportMutation.isError ? (
              <p className="text-sm text-destructive w-full">
                Export failed. Try again.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
