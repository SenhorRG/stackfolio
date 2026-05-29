'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  mergeSkillCategoryOrder,
  collectProfileSkillDisplayCategories,
  filterHiddenSkillCategoriesToActive,
  parseProfileIdentity,
  resolveSkillInlineFormatOptions,
  toggleHiddenSkillCategory,
  type ProfileIdentity,
} from '@stackfolio/shared';
import { apiFetch } from '@/lib/api-client';
import {
  useApiToken,
  useAuthenticatedQueryEnabled,
} from '@/features/auth/hooks/use-api-token';
import { AddSkillToProfile } from '@/features/skills/components/add-skill-to-profile';
import { ProfileSkillCategoryOrderList } from '@/features/profiles/components/profile-skill-category-order-list';
import { ProfileSkillResumeDisplayOptions } from '@/features/profiles/components/profile-skill-resume-display-options';
import {
  ProfileSkillsTable,
  type ProfileSkillRow,
} from '@/features/profiles/components/profile-skills-table';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';

type Profile = {
  id: string;
  name: string;
  profileData: unknown;
  skills: ProfileSkillRow[];
};

export default function ProfileSkillsPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useApiToken();
  const queryEnabled = useAuthenticatedQueryEnabled();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => apiFetch<Profile>(`/profiles/${id}`, { token: token! }),
    enabled: queryEnabled,
  });

  const updateSkillMutation = useMutation({
    mutationFn: (entry: {
      skillId: string;
      level: string;
      years?: number | null;
      highlight?: boolean;
      displayCategory?: string | null;
    }) =>
      apiFetch(`/profiles/${id}/skills`, {
        method: 'POST',
        token: token!,
        body: JSON.stringify({
          skillId: entry.skillId,
          level: entry.level,
          years: entry.years ?? undefined,
          highlight: entry.highlight,
          displayCategory: entry.displayCategory ?? undefined,
        }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', id] }),
  });

  const updateProfileIdentityMutation = useMutation({
    mutationFn: (nextIdentity: ProfileIdentity) =>
      apiFetch(`/profiles/${id}/profile-data`, {
        method: 'PATCH',
        token: token!,
        body: JSON.stringify(nextIdentity),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', id] }),
  });

  const identity = useMemo(
    () => parseProfileIdentity(data?.profileData),
    [data?.profileData],
  );

  const categoryOrder = useMemo(() => {
    if (!data) return [];
    const activeCategories = collectProfileSkillDisplayCategories(data.skills);
    return mergeSkillCategoryOrder(
      identity.skillCategoryOrder,
      activeCategories,
    );
  }, [data, identity.skillCategoryOrder]);

  const hiddenCategories = useMemo(
    () =>
      filterHiddenSkillCategoriesToActive(
        identity.hiddenSkillCategories,
        categoryOrder,
      ),
    [identity.hiddenSkillCategories, categoryOrder],
  );

  const resumeDisplay = useMemo(
    () => resolveSkillInlineFormatOptions(identity),
    [identity],
  );

  function saveIdentity(patch: Partial<ProfileIdentity>) {
    updateProfileIdentityMutation.mutate({
      ...identity,
      ...patch,
    });
  }

  if (!queryEnabled || isLoading) return <p>Loading...</p>;
  if (!data) return <p>Profile not found.</p>;

  const isSaving =
    updateSkillMutation.isPending || updateProfileIdentityMutation.isPending;

  return (
    <PageContainer>
      <PageHeader
        title={`Skills — ${data.name}`}
        backHref={`/profiles/${id}`}
        backLabel="Profile"
      />

      {token && (
        <AddSkillToProfile
          profileId={id}
          token={token}
          existingSkillIds={data.skills.map((row) => row.skillId)}
        />
      )}

      <div className="space-y-8">
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Profile skills</h2>
            <p className="text-sm text-muted-foreground">
              All skills assigned to this profile. Click column headers to sort.
              Highlighted skills also appear under Core Stack on the resume.
            </p>
          </div>
          <ProfileSkillResumeDisplayOptions
            showLevel={resumeDisplay.showLevel}
            showYears={resumeDisplay.showYears}
            disabled={isSaving || !token}
            onShowLevelChange={(showLevel) =>
              saveIdentity({ skillShowLevel: showLevel })
            }
            onShowYearsChange={(showYears) =>
              saveIdentity({ skillShowYears: showYears })
            }
          />
          <ProfileSkillsTable
            profileId={id}
            token={token ?? undefined}
            skills={data.skills}
            disabled={isSaving || !token}
            onUpdate={(entry) => updateSkillMutation.mutate(entry)}
          />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Category display order</h2>
            <p className="text-sm text-muted-foreground">
              Drag to control how skill categories appear on the resume. Use the
              eye icon to hide a category from the resume. Core Stack is
              included when at least one skill is highlighted.
            </p>
          </div>
          <ProfileSkillCategoryOrderList
            categories={categoryOrder}
            hiddenCategories={hiddenCategories}
            disabled={isSaving || !token}
            onReorder={(skillCategoryOrder) =>
              saveIdentity({ skillCategoryOrder })
            }
            onToggleVisibility={(category) =>
              saveIdentity({
                hiddenSkillCategories: toggleHiddenSkillCategory(
                  hiddenCategories,
                  category,
                ),
              })
            }
          />
        </section>
      </div>
    </PageContainer>
  );
}
