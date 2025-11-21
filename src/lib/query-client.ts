import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (antigo cacheTime)
      retry: 1,
      refetchOnWindowFocus: false, // React Native não precisa
    },
  },
});

