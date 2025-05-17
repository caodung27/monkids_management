'use client';

import { 
  QueryClient, 
  QueryClientProvider 
} from '@tanstack/react-query';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store/store';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthWrapper from '@/components/auth/AuthWrapper';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useState, useEffect } from 'react';

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

// Enhanced theme with better dark mode support
const theme = createTheme({
  // Base theme properties
  primaryColor: 'blue',
  primaryShade: 6,
  fontFamily: 'Roboto, sans-serif',
  fontFamilyMonospace: 'monospace',
  headings: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  
  // Light mode
  colors: {
    // Blue shades
    blue: [
      '#e6f7ff', '#bae7ff', '#91d5ff', '#69c0ff', 
      '#40a9ff', '#1890ff', '#096dd9', '#0050b3', 
      '#003a8c', '#002766'
    ],
    // Light mode background shades
    gray: [
      '#f8f9fa', '#f1f3f5', '#e9ecef', '#dee2e6',
      '#ced4da', '#adb5bd', '#868e96', '#495057',
      '#343a40', '#212529'
    ],
    // Other color definitions...
  },
  
  // Component specific styling
  components: {
    Paper: {
      defaultProps: {
        p: 'md',
        shadow: 'sm',
      },
    },
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
  },

  // Color scheme specific overrides
  other: {
    colorSchemeStyles: {
      dark: {
        // Dark mode specific styles
        backgroundColor: '#1a1b1e',
        textColor: '#c1c2c5',
        paperBg: '#25262b',
        borderColor: '#2c2e33',
        dividerColor: '#373a40'
      },
      light: {
        // Light mode specific styles
        backgroundColor: '#ffffff',
        textColor: '#1a1b1e',
        paperBg: '#ffffff',
        borderColor: '#e9ecef',
        dividerColor: '#dee2e6'
      }
    }
  }
});

export default function App({ children }: { children: React.ReactNode }) {
  // Get color scheme from localStorage or use system preference as default
  const [colorScheme, setColorScheme] = useLocalStorage<'light' | 'dark'>(
    'mantine-color-scheme',
    'light'
  );

  // Set initial color scheme based on system preference if not set
  useEffect(() => {
    if (!localStorage.getItem('mantine-color-scheme')) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setColorScheme(prefersDark ? 'dark' : 'light');
    }
  }, [setColorScheme]);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider
          theme={theme}
          defaultColorScheme={colorScheme}
        >
          <Notifications position="top-right" />
          <AuthProvider>
            <AuthWrapper>
              {children}
            </AuthWrapper>
          </AuthProvider>
        </MantineProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
} 