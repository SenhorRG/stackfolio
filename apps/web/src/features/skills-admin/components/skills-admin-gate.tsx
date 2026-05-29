'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useApiToken } from '@/features/auth/hooks/use-api-token';

type Props = {
  children: React.ReactNode;
};

export function SkillsAdminGate({ children }: Props) {
  const router = useRouter();
  const { token, isReady, isAuthenticated, isLoading } = useApiToken();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/login?callbackUrl=/skills/admin');
    }
  }, [isAuthenticated, isReady, router]);

  if (isLoading || !isReady) {
    return <p>Checking session…</p>;
  }

  if (!isAuthenticated || !token) {
    return (
      <p>
        Sign in to manage skills.{' '}
        <Link href="/login" className="text-primary hover:underline">
          Go to login
        </Link>
      </p>
    );
  }

  return <>{children}</>;
}
