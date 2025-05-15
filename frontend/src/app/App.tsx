'use client';

import { 
  QueryClient, 
  QueryClientProvider 
} from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store/store';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 1,
    },
  },
});

export default function App({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <Notifications position="top-right" />
          {children}
        </MantineProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
} 