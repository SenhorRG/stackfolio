'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfileStacksRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/profiles/${id}/skills`);
  }, [id, router]);

  return <p>Redirecting to skills…</p>;
}
