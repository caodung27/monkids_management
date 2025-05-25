'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Notifications } from '@mantine/notifications';
import { MantineProvider, createTheme, MantineTheme, localStorageColorSchemeManager } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { AuthProvider } from '@/contexts/AuthContext';

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5C5F66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  components: {
    Badge: {
      styles: (_theme: MantineTheme) => ({
        root: {
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        },
      }),
    },
  },
  // other: {
  //   darkMode: {
  //     colors: {
  //       green: '#31B237', // Slightly brighter green
  //       red: '#FF5252',   // Slightly brighter red
  //       yellow: '#FBBF24', // Slightly brighter yellow
  //     },
  //   },
  // },
});

const queryClient = new QueryClient();

// Create the color scheme manager instance from local storage
const colorSchemeManager = localStorageColorSchemeManager();

export function Providers({ children }: { children: React.ReactNode }) {
  // Removed useMantineColorScheme hook and useEffect for manual management

  return (
    <MantineProvider 
      theme={theme} 
      defaultColorScheme="light" // Fallback default
      colorSchemeManager={colorSchemeManager}
    >
      <QueryClientProvider client={queryClient}>
        <Notifications position="top-right" />
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </MantineProvider>
  );
} 