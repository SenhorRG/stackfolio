'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileCardMenu } from './profile-card-menu';

export type ProfileCardData = {
  id: string;
  name: string;
  isMain?: boolean;
  _count?: { resumeProjects: number };
};

type ProfileCardProps = {
  profile: ProfileCardData;
  showMenu?: boolean;
  isPending?: boolean;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
};

export function ProfileCard({
  profile,
  showMenu = false,
  isPending = false,
  onDuplicate,
  onDelete,
  className,
}: ProfileCardProps) {
  return (
    <Card
      className={`min-w-[240px] shrink-0 ${profile.isMain ? 'border-primary' : ''} ${className ?? ''}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-base">
          {profile.name}
          {profile.isMain && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (main)
            </span>
          )}
        </CardTitle>
        {showMenu && onDuplicate && onDelete && (
          <ProfileCardMenu
            profileId={profile.id}
            profileName={profile.name}
            isMain={Boolean(profile.isMain)}
            isPending={isPending}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {profile._count?.resumeProjects ?? 0} resume(s)
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/profiles/${profile.id}`}>
            <Button size="sm">Open</Button>
          </Link>
          <Link href={`/profiles/${profile.id}/skills`}>
            <Button variant="outline" size="sm">
              Skills
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
