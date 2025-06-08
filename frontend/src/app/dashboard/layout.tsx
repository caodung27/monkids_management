'use client';

import { useState } from 'react';
import { AppShell } from '@mantine/core';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, setOpened] = useState(false);
  
  const toggleNav = () => setOpened((o) => !o);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ 
        width: 300, 
        breakpoint: 'sm', 
        collapsed: { mobile: !opened }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Header opened={opened} toggle={toggleNav} />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}