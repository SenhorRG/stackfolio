'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { useResumeProject } from '@/features/resume/hooks/use-resume-project';
import {
  useApiToken,
  useAuthenticatedQueryEnabled,
} from '@/features/auth/hooks/use-api-token';
import { ResumeEditor } from '@/features/resume/components/resume-editor';

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { token, isLoading: authLoading, isAuthenticated } = useApiToken();
  const queryEnabled = useAuthenticatedQueryEnabled();
  const { data: project, isLoading } = useResumeProject(
    projectId,
    queryEnabled ? token : undefined,
  );

  useEffect(() => {
    if (!token || !projectId) return;
    apiFetch(`/resume-projects/${projectId}/track-recent`, {
      method: 'POST',
      token,
      body: JSON.stringify({}),
    }).catch(() => undefined);
  }, [projectId, token]);

  if (authLoading) return <p>Loading...</p>;

  if (!isAuthenticated) {
    return (
      <p>
        <Link href="/login" className="text-primary">
          Sign in
        </Link>{' '}
        to edit resumes.
      </p>
    );
  }

  if (isLoading || !project || !token) return <p>Loading editor...</p>;

  return (
    <ResumeEditor projectId={projectId} token={token} initial={project} />
  );
}
