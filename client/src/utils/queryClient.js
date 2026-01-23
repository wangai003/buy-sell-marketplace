import { QueryClient } from '@tanstack/react-query';

// Export the same QueryClient instance used in the root
// This ensures we're using the exact same instance with contextSharing enabled
export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

