import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './api-error';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status === 401) {
            return false;
          }
          const message =
            error instanceof Error ? error.message : String(error);
          if (message.includes('401') || message.includes('Unauthorized')) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
