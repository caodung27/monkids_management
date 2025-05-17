import App from './App';
import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Monkids Management System',
  description: 'Student and Teacher Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <App>
          <AppLayout>
            {children}
          </AppLayout>
        </App>
      </body>
    </html>
  );
}
