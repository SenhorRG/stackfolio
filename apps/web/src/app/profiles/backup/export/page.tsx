'use client';

import Link from 'next/link';
import { ProfileBackupExportView } from '@/features/profiles/backup/profile-backup-export-view';
import {
  useApiToken,
} from '@/features/auth/hooks/use-api-token';

export default function ProfileBackupExportPage() {
  const { isLoading: authLoading, isAuthenticated } = useApiToken();

  if (authLoading) return <p>Loading...</p>;

  if (!isAuthenticated) {
    return (
      <p>
        <Link href="/login" className="text-primary">
          Sign in
        </Link>{' '}
        to export backup.
      </p>
    );
  }

  return <ProfileBackupExportView />;
}
