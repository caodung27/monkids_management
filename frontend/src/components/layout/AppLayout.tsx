'use client';

import { ReactNode, useEffect } from 'react';
import { useMantineColorScheme } from '@mantine/core';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * AppLayout wraps all pages and ensures i18n and theme settings are consistently applied
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const { colorScheme } = useMantineColorScheme();
  
  return (
    <div className="app-layout" data-theme={colorScheme}>
      {children}
    </div>
  );
} 