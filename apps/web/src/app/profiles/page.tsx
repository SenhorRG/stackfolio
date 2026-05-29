'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import {
  useApiToken,
  useAuthenticatedQueryEnabled,
} from '@/features/auth/hooks/use-api-token';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProfileCard } from '@/features/profiles/components/profile-card';
import { ProfileCreateFromPdf } from '@/features/profiles/components/profile-create-from-pdf';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';

type Profile = {
  id: string;
  name: string;
  isMain: boolean;
  _count?: { resumeProjects: number };
  skills?: Array<{ skill: { name: string } }>;
};

export default function ProfilesPage() {
  const { isLoading: authLoading, isAuthenticated } = useApiToken();
  const { token } = useApiToken();
  const queryEnabled = useAuthenticatedQueryEnabled();
  const [name, setName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => apiFetch<Profile[]>('/profiles', { token: token! }),
    enabled: queryEnabled,
  });

  const createMutation = useMutation({
    mutationFn: (opts: { copyFromMain?: boolean }) =>
      apiFetch<Profile>('/profiles', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({
          name: name.trim(),
          copyFromMain: opts.copyFromMain ?? false,
        }),
      }),
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setName('');
      setShowCreate(false);
      window.location.href = `/profiles/${profile.id}`;
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<Profile>(`/profiles/${id}/duplicate`, {
        method: 'POST',
        token: token!,
        body: JSON.stringify({}),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/profiles/${id}`, { method: 'DELETE', token: token! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });

  if (authLoading) return <p>Loading...</p>;

  if (!isAuthenticated) {
    return (
      <p>
        <Link href="/login" className="text-primary">
          Sign in
        </Link>{' '}
        to manage profiles.
      </p>
    );
  }

  const profiles = data ?? [];
  const pending =
    createMutation.isPending ||
    duplicateMutation.isPending ||
    deleteMutation.isPending;
  const canCreate = name.trim().length > 0;

  return (
    <PageContainer>
      <PageHeader
        title="Profiles"
        actions={
          <Button onClick={() => setShowCreate((v) => !v)}>New profile</Button>
        }
      />

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create a separate profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Profile name (required)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={pending || !canCreate}
                onClick={() => createMutation.mutate({ copyFromMain: false })}
              >
                Create empty profile
              </Button>
              <Button
                disabled={pending || !canCreate}
                onClick={() => createMutation.mutate({ copyFromMain: true })}
              >
                Copy from main profile
              </Button>
              <ProfileCreateFromPdf
                profileName={name}
                token={token!}
                disabled={pending || !canCreate}
                onCreated={(profileId) => {
                  queryClient.invalidateQueries({ queryKey: ['profiles'] });
                  setName('');
                  setShowCreate(false);
                  window.location.href = `/profiles/${profileId}`;
                }}
              />
            </div>
            {!canCreate && (
              <p className="text-sm text-muted-foreground">
                Enter a profile name before creating.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && <p>Loading...</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <ProfileCard
            key={p.id}
            profile={p}
            showMenu
            isPending={pending}
            onDuplicate={(id) => duplicateMutation.mutate(id)}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>
    </PageContainer>
  );
}
