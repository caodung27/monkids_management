'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TokenService } from '@/api/apiService';

// Define public paths (matching the ones in AuthCheck)
const publicPaths = [
  '/auth/login', 
  '/auth/register',
  '/auth/callback', 
  '/auth/oauth-callback', 
  '/auth/error'
];

export default function App({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if current path is public
    const isPublicPath = publicPaths.some(path => pathname?.startsWith(path));
    
    // Only redirect to login if not on a public path and no token exists
    const token = TokenService.getAccessToken();
    if (!token && !isPublicPath) {
      router.push('/auth/login');
    }
  }, [router, pathname]);

  return <>{children}</>;
} 
