'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import {
  useApiToken,
  useAuthenticatedQueryEnabled,
} from '@/features/auth/hooks/use-api-token';
import { Button } from '@/components/ui/button';
import { ProfileCard, type ProfileCardData } from '@/features/profiles/components/profile-card';
import { ResumeCard } from '@/features/resume/components/resume-card';
import { HorizontalCardCarousel } from '@/components/ui/horizontal-card-carousel';

type DashboardResponse = {
  mainProfile: ProfileCardData | null;
  recentProfiles: ProfileCardData[];
  recentResumes: Array<{
    id: string;
    name: string;
    profile: { id: string; name: string; isMain?: boolean };
  }>;
};

export default function HomePage() {
  const { token, isAuthenticated, isLoading: authLoading } = useApiToken();
  const queryEnabled = useAuthenticatedQueryEnabled();

  const { data: dashboard } = useQuery({
    queryKey: ['home-dashboard'],
    queryFn: () =>
      apiFetch<DashboardResponse>('/home/dashboard', { token: token! }),
    enabled: queryEnabled,
  });

  const { data: learning } = useQuery({
    queryKey: ['home-learning'],
    queryFn: () =>
      apiFetch<
        Array<{
          skill: { name: string; slug: string };
          relationType: string;
          sourceSkillName: string;
          reason: string;
        }>
      >('/home/learning', { token: token! }),
    enabled: queryEnabled,
  });

  const recentProfiles =
    dashboard?.recentProfiles?.filter((p) => p.id !== dashboard.mainProfile?.id) ??
    [];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">Stackfolio</h1>
        <p className="text-muted-foreground">
          Organize your tech stack and export ATS-safe resume PDFs.
        </p>
      </section>

      {authLoading ? (
        <p>Loading...</p>
      ) : !isAuthenticated ? (
        <p>
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>{' '}
          to see your profiles and learning suggestions.
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">Profiles</h2>
              <Link href="/profiles">
                <Button variant="outline" size="sm">
                  All profiles
                </Button>
              </Link>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="w-full shrink-0 lg:w-[280px]">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Main profile
                </p>
                {dashboard?.mainProfile ? (
                  <ProfileCard
                    profile={dashboard.mainProfile}
                    className="w-full lg:sticky lg:top-4"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Loading main profile…
                  </p>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <HorizontalCardCarousel
                  title="Recently accessed"
                  emptyMessage="No recent profiles yet. Open a profile to see it here."
                >
                  {recentProfiles.map((p) => (
                    <ProfileCard key={p.id} profile={p} className="snap-start" />
                  ))}
                </HorizontalCardCarousel>
              </div>
            </div>
          </section>

          <HorizontalCardCarousel
            title="Recent resumes"
            emptyMessage="No recent resumes yet. Open a resume in the editor to see it here."
          >
            {dashboard?.recentResumes?.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </HorizontalCardCarousel>

          <section>
            <h2 className="mb-3 text-xl font-semibold">Learning</h2>
            <p className="mb-2 text-sm text-muted-foreground">
              Suggestions from your main profile&apos;s skills.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {learning?.map((s) => (
                <li key={s.skill.slug} className="rounded border p-3">
                  <Link
                    href={`/skills/${s.skill.slug}`}
                    className="font-medium text-primary"
                  >
                    {s.skill.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{s.reason}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section className="flex gap-3">
        <Link href="/skills">
          <Button>Browse skills</Button>
        </Link>
        <Link href="/profiles">
          <Button variant="outline">Profiles</Button>
        </Link>
      </section>
    </div>
  );
}
