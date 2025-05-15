import { Metadata } from 'next';
import '@mantine/core/styles.css';
import '../styles/globals.css';
import { AppProvider } from '../contexts/AppContext';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

export const metadata: Metadata = {
  title: 'Mầm Non MonKids',
  description: 'Hệ thống quản lý học sinh và giáo viên',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <ColorSchemeScript />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
      </head>
      <body>
        <MantineProvider>
          <Notifications />
          <AppProvider>
        {children}
          </AppProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
