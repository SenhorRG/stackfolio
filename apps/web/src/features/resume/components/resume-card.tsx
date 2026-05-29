'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type ResumeCardData = {
  id: string;
  name: string;
  profile?: { id: string; name: string; isMain?: boolean };
  updatedAt?: string;
};

export function ResumeCard({ resume }: { resume: ResumeCardData }) {
  const profileLabel = resume.profile
    ? `${resume.profile.name}${resume.profile.isMain ? ' (main)' : ''}`
    : 'Unknown profile';

  return (
    <Card className="min-w-[240px] shrink-0">
      <CardHeader>
        <CardTitle className="text-base">{resume.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">Profile: {profileLabel}</p>
        <Link href={`/editor/${resume.id}`}>
          <Button size="sm">Open editor</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
