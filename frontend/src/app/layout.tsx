import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import App from './App';
import { Providers } from './providers';
import './globals.css';
import { ColorSchemeScript } from '@mantine/core';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Monkid Management',
  description: 'Monkid Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className={inter.className}>
        <Providers>
          <App>{children}</App>
        </Providers>
      </body>
    </html>
  );
}
