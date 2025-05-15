import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '../styles/globals.css';

// Dynamic import to avoid server component issues
const App = dynamic(() => import('./App'), { ssr: true });

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
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
      </head>
      <body>
        <App>{children}</App>
      </body>
    </html>
  );
}
