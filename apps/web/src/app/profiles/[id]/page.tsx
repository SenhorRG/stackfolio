'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { parseProfileIdentity, type ProfileIdentity } from '@stackfolio/shared';
import { apiFetch } from '@/lib/api-client';
import {
  useApiToken,
  useAuthenticatedQueryEnabled,
} from '@/features/auth/hooks/use-api-token';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProfileDataForm } from '@/features/profiles/components/profile-data-form';
import { ProfileFillActions } from '@/features/profiles/components/profile-fill-actions';
import { ProfilePdfImportSection } from '@/features/profiles/components/profile-pdf-import-section';
import { ProfileSkillsList } from '@/features/profiles/components/profile-skills-list';
import { ResumeCardMenu } from '@/features/resume/components/resume-card-menu';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';

type ProfileDetail = {
  id: string;
  name: string;
  isMain: boolean;
  profileData: unknown;
  skills: Array<{
    skillId: string;
    level: string;
    years: number | null;
    highlight: boolean;
    skill: { name: string; slug: string };
  }>;
};

type ResumeProject = {
  id: string;
  name: string;
  updatedAt: string;
};

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useApiToken();
  const queryEnabled = useAuthenticatedQueryEnabled();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () =>
      apiFetch<ProfileDetail>(`/profiles/${id}`, { token: token! }),
    enabled: queryEnabled,
  });

  useEffect(() => {
    if (!token || !id) return;
    apiFetch(`/profiles/${id}/track-recent`, {
      method: 'POST',
      token,
      body: JSON.stringify({}),
    }).catch(() => undefined);
  }, [id, token]);

  const { data: projects } = useQuery({
    queryKey: ['resume-projects', id],
    queryFn: () =>
      apiFetch<ResumeProject[]>(`/resume-projects/profile/${id}`, {
        token: token!,
      }),
    enabled: queryEnabled,
  });

  const profileIdentity: ProfileIdentity | null = profile?.profileData
    ? parseProfileIdentity(profile.profileData)
    : null;

  const createResume = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>('/resume-projects', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({ profileId: id }),
      }),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ['resume-projects', id] });
      window.location.href = `/editor/${p.id}`;
    },
  });

  const renameResume = useMutation({
    mutationFn: ({ projectId, name }: { projectId: string; name: string }) =>
      apiFetch(`/resume-projects/${projectId}`, {
        method: 'PATCH',
        token: token!,
        body: JSON.stringify({ name }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['resume-projects', id] }),
  });

  const duplicateResume = useMutation({
    mutationFn: (projectId: string) =>
      apiFetch<ResumeProject>(`/resume-projects/${projectId}/duplicate`, {
        method: 'POST',
        token: token!,
        body: JSON.stringify({}),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['resume-projects', id] }),
  });

  const deleteResume = useMutation({
    mutationFn: (projectId: string) =>
      apiFetch(`/resume-projects/${projectId}`, {
        method: 'DELETE',
        token: token!,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['resume-projects', id] }),
  });

  if (!queryEnabled || isLoading) return <p>Loading...</p>;
  if (!profile) return <p>Profile not found.</p>;

  const displayName = profile.name;
  const resumePending =
    createResume.isPending ||
    duplicateResume.isPending ||
    deleteResume.isPending;

  const titleNode = isEditing ? (
    <Input
      id="profile-display-name"
      name="profile-display-name"
      className="h-9 max-w-md text-2xl font-bold"
      value={profileName || displayName}
      onChange={(e) => setProfileName(e.target.value)}
      placeholder="Profile name"
    />
  ) : (
    <>
      {displayName}
      {profile.isMain && (
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          (main)
        </span>
      )}
    </>
  );

  return (
    <PageContainer>
      <PageHeader
        title={titleNode}
        backHref="/profiles"
        backLabel="Profiles"
        actions={
          <>
            {isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setProfileName('');
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProfileName(displayName);
                  setIsEditing(true);
                }}
              >
                Edit
              </Button>
            )}
          </>
        }
      />

      {token && (
        <ProfileDataForm
          profileId={id}
          token={token}
          initial={profileIdentity}
          profileName={(profileName.trim() || displayName).trim()}
          readOnly={!isEditing}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['profile', id] });
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            setProfileName('');
            setIsEditing(false);
          }}
          editToolbar={
            isEditing ? (
              <>
                <ProfileFillActions
                  compact
                  profileId={id}
                  token={token}
                  isMain={profile.isMain}
                  profileData={profile.profileData}
                  skillsCount={profile.skills?.length ?? 0}
                  onSynced={() =>
                    queryClient.invalidateQueries({ queryKey: ['profile', id] })
                  }
                />
                <ProfilePdfImportSection
                  compact
                  profileId={id}
                  token={token}
                  profileData={profile.profileData}
                  skillsCount={profile.skills?.length ?? 0}
                  onImported={() =>
                    queryClient.invalidateQueries({ queryKey: ['profile', id] })
                  }
                />
              </>
            ) : undefined
          }
        />
      )}

      <ProfileSkillsList profileId={id} skills={profile.skills ?? []} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Resumes</h2>
          <Button
            onClick={() => createResume.mutate()}
            disabled={createResume.isPending}
          >
            New resume
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <CardTitle className="flex-1 text-base">
                  {isEditing ? (
                    <Input
                      id={`resume-card-name-${p.id}`}
                      name={`resume-card-name-${p.id}`}
                      defaultValue={p.name}
                      className="h-8 text-base font-semibold"
                      onBlur={(e) => {
                        const next = e.target.value.trim();
                        if (next && next !== p.name) {
                          renameResume.mutate({ projectId: p.id, name: next });
                        }
                      }}
                    />
                  ) : (
                    <span>{p.name}</span>
                  )}
                </CardTitle>
                <ResumeCardMenu
                  projectName={p.name}
                  isPending={resumePending}
                  onDuplicate={() => duplicateResume.mutate(p.id)}
                  onDelete={() => deleteResume.mutate(p.id)}
                />
              </CardHeader>
              <CardContent>
                <Link href={`/editor/${p.id}`}>
                  <Button size="sm">Open editor</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        {!projects?.length && (
          <p className="text-sm text-muted-foreground">
            No resumes yet. Create one from this profile.
          </p>
        )}
      </section>
    </PageContainer>
  );
}
