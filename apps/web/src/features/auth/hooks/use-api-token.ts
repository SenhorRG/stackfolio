'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export function useApiToken() {
  const { data: session, status } = useSession();
  return useMemo(
    () => ({
      token: session?.apiToken,
      isLoading: status === 'loading',
      isReady: status !== 'loading',
      isAuthenticated: status === 'authenticated',
      userName:
        session?.user?.name ?? session?.user?.email ?? 'Account',
      userEmail: session?.user?.email,
    }),
    [
      session?.apiToken,
      session?.user?.name,
      session?.user?.email,
      status,
    ],
  );
}

export function useAuthenticatedQueryEnabled() {
  const { token, isReady, isAuthenticated } = useApiToken();
  return isReady && isAuthenticated && Boolean(token);
}
